import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Read url from .env.local
const envPath = "c:/Users/ammar/Downloads/urbankicks-demo_1/urbankicks-demo/.env.local";
let url = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.trim().match(/^VITE_SUPABASE_URL=(.*)$/);
    if (match) url = match[1].trim().replace(/^['"]|['"]$/g, "");
  }
}

const email = process.argv[2];
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[3];

if (!url || !email || !serviceKey) {
  console.error("\n❌ Missing parameters!");
  console.error("Usage: npx tsx scripts/promote-admin.ts <email> <SUPABASE_SERVICE_ROLE_KEY>");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  console.log(`\nConnecting to Supabase at: ${url}`);
  console.log(`Searching for user with email: "${email}"...`);
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`\n❌ User with email "${email}" was not found in Supabase Auth.`);
    console.error("Please sign up / register this email on your storefront registration page first, then run this script to promote it.");
    process.exit(1);
  }
  
  console.log(`Found user: ${user.id}`);
  console.log("Adding user to staff_members table as 'super_admin'...");
  
  const { error: upsertError } = await supabase
    .from("staff_members")
    .upsert({
      id: user.id,
      name: user.user_metadata?.full_name || "Admin User",
      email: user.email,
      role_id: "super_admin",
      active: true
    }, { onConflict: "id" });
    
  if (upsertError) throw upsertError;
  
  console.log(`\n✅ Successfully promoted ${email} to Super Admin!`);
  console.log("You can now log in securely at http://localhost:5173/admin/login");
}

main().catch(err => {
  console.error("\n❌ Promotion failed:", err.message);
  process.exit(1);
});
