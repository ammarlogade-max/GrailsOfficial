// One-time bulk importer: reads test_import_template.xlsx and creates every
// Test Group + Test Parameter row in Supabase in one shot, instead of
// typing each one into the Test Master screen by hand.
//
// USAGE:
//   1. Fill in test_import_template.xlsx (see the "Read Me First" tab).
//   2. Put this file anywhere convenient, e.g. apps/desktop/scripts/import-tests.mjs
//   3. From that folder:  npm install @supabase/supabase-js xlsx
//   4. Run:
//        node import-tests.mjs --file ./test_import_template.xlsx \
//          --url https://YOUR-PROJECT-REF.supabase.co \
//          --anon-key YOUR_ANON_KEY \
//          --email you@yourlab.com --password your_admin_password
//
//      (Runs AS your admin login, not with a service-role key, so it goes
//      through the same RLS policies as the app itself — your admin role
//      is what's allowed to write to test_groups/test_parameters per
//      0001_init_schema.sql. No secret key needs to live in this script.)
//
// Safe to re-run: a group_key whose display_name already exists in the
// database is skipped (not duplicated). To re-import a group you already
// loaded — e.g. because you fixed a typo — delete it from Test Master in
// the app first, then re-run this script.

import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import ws from 'ws';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const filePath = arg('file');
const url = arg('url');
const anonKey = arg('anon-key');
const email = arg('email');
const password = arg('password');

if (!filePath || !url || !anonKey || !email || !password) {
  console.error(
    'Usage: node import-tests.mjs --file <path.xlsx> --url <supabase-url> --anon-key <key> --email <admin-email> --password <admin-password>'
  );
  process.exit(1);
}

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v || '').trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1';
}
function nullIfBlank(v) {
  const s = v === undefined || v === null ? '' : String(v).trim();
  return s === '' ? null : s;
}

async function main() {
  const supabase = createClient(url, anonKey, {
    realtime: { transport: ws },
  });

  console.log(`Signing in as ${email}...`);
  const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr) {
    console.error('Sign-in failed:', authErr.message);
    process.exit(1);
  }

  const wb = xlsx.readFile(filePath);
  const groupRows = xlsx.utils.sheet_to_json(wb.Sheets['Test Groups']);
  const paramRows = xlsx.utils.sheet_to_json(wb.Sheets['Test Parameters']);

  if (groupRows.length === 0) {
    console.error('No rows found in the "Test Groups" tab — nothing to import.');
    process.exit(1);
  }

  console.log(`Found ${groupRows.length} test group(s) and ${paramRows.length} parameter row(s).`);

  const { data: existing, error: existingErr } = await supabase.from('test_groups').select('id, display_name');
  if (existingErr) {
    console.error('Could not check existing test groups:', existingErr.message);
    process.exit(1);
  }
  const existingNames = new Set((existing || []).map((g) => g.display_name.trim().toLowerCase()));

  const groupKeyToId = {};
  let created = 0;
  let skipped = 0;
  let failures = 0;

  for (const row of groupRows) {
    const groupKey = String(row.group_key || '').trim();
    const displayName = String(row.display_name || '').trim();
    if (!groupKey || !displayName) {
      console.warn('Skipping a Test Groups row with no group_key/display_name.');
      continue;
    }

    if (existingNames.has(displayName.toLowerCase())) {
      console.log(`  [skip] "${displayName}" already exists in the database.`);
      const match = existing.find((g) => g.display_name.trim().toLowerCase() === displayName.toLowerCase());
      groupKeyToId[groupKey] = match.id;
      skipped++;
      continue;
    }

    const { data: inserted, error } = await supabase
      .from('test_groups')
      .insert({
        display_name: displayName,
        report_title: nullIfBlank(row.report_title) || displayName,
        short_name: nullIfBlank(row.short_name) || displayName,
        rate: Number(row.rate) || 0,
        department: nullIfBlank(row.department) || '',
        specimen_type: nullIfBlank(row.specimen_type),
        sample_volume: nullIfBlank(row.sample_volume),
        container_type: nullIfBlank(row.container_type),
        report_sequence: row.report_sequence !== undefined && row.report_sequence !== '' ? Number(row.report_sequence) : 0,
        method_interpretation: nullIfBlank(row.method_interpretation) || '',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`  [FAILED] "${displayName}":`, error.message);
      failures++;
      continue;
    }
    groupKeyToId[groupKey] = inserted.id;
    created++;
    console.log(`  [created] "${displayName}"`);
  }

  console.log(`\nTest Groups: ${created} created, ${skipped} skipped (already existed).\n`);

  // Group parameter rows by group_key, in file order, so sort_order can be
  // assigned positionally when the sheet doesn't specify one.
  const paramsByGroup = {};
  for (const row of paramRows) {
    const groupKey = String(row.group_key || '').trim();
    if (!groupKey) continue;
    (paramsByGroup[groupKey] = paramsByGroup[groupKey] || []).push(row);
  }

  let paramsCreated = 0;
  for (const [groupKey, rows] of Object.entries(paramsByGroup)) {
    const testGroupId = groupKeyToId[groupKey];
    if (!testGroupId) {
      console.warn(`  [skip] Parameters for group_key "${groupKey}" — no matching Test Groups row found.`);
      continue;
    }

    // Only insert parameters for groups we just created — a group that was
    // [skip]ped already has its own parameters from whenever it was first
    // imported, so re-inserting here would duplicate them.
    const wasJustCreated = !existingNames.has(
      (groupRows.find((g) => String(g.group_key).trim() === groupKey)?.display_name || '').trim().toLowerCase()
    );
    if (!wasJustCreated) continue;

    const payload = rows.map((row, i) => ({
      test_group_id: testGroupId,
      name: String(row.name || '').trim(),
      unit: nullIfBlank(row.unit),
      default_value: nullIfBlank(row.default_value),
      formula: nullIfBlank(row.formula),
      decimal_format: nullIfBlank(row.decimal_format),
      is_bold: parseBool(row.is_bold),
      normal_range_male: nullIfBlank(row.normal_range_male),
      normal_range_female: nullIfBlank(row.normal_range_female),
      normal_range_child_male: nullIfBlank(row.normal_range_child_male),
      normal_range_child_female: nullIfBlank(row.normal_range_child_female),
      analyzer_code: nullIfBlank(row.analyzer_code),
      critical_low: row.critical_low !== undefined && row.critical_low !== '' ? Number(row.critical_low) : null,
      critical_high: row.critical_high !== undefined && row.critical_high !== '' ? Number(row.critical_high) : null,
      report_comment: nullIfBlank(row.report_comment),
      is_required: row.is_required === undefined || row.is_required === '' ? true : parseBool(row.is_required),
      sort_order: row.sort_order !== undefined && row.sort_order !== '' ? Number(row.sort_order) : i,
    }));

    const { error } = await supabase.from('test_parameters').insert(payload);
    if (error) {
      console.error(`  [FAILED] parameters for "${groupKey}":`, error.message);
      failures++;
      continue;
    }
    paramsCreated += payload.length;
    console.log(`  [created] ${payload.length} parameter(s) for "${groupKey}"`);
  }

  console.log(`\nDone. ${created} test group(s) and ${paramsCreated} parameter(s) created; ${failures} insert operation(s) failed.`);
  await supabase.auth.signOut();
  if (failures > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
