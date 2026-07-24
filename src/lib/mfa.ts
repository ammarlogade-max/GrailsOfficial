import { supabase } from "./supabase";

export interface MFAFactor {
  id: string;
  friendlyName?: string;
  status: string;
  createdAt: string;
}

/** Lists TOTP factors already enrolled for the current user. */
export async function listFactors(): Promise<MFAFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return (data?.totp || []).map((f) => ({ id: f.id, friendlyName: f.friendly_name, status: f.status, createdAt: f.created_at }));
}

/** Starts TOTP enrollment — returns a QR code (SVG string) and the plain-text secret as a manual fallback. */
export async function startEnrollment(friendlyName = "Authenticator App") {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName });
  if (error) throw error;
  return { factorId: data.id, qrCodeSvg: data.totp.qr_code, secret: data.totp.secret };
}

/** Completes enrollment by verifying the first code from the authenticator app. */
export async function confirmEnrollment(factorId: string, code: string) {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;
  const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (verifyError) throw verifyError;
}

export async function unenroll(factorId: string) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

/** True if the session needs a second factor before it's fully trusted (aal2). */
export async function needsMfaChallenge(): Promise<{ required: boolean; factorId?: string }> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  if (data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
    const factors = await listFactors();
    const verified = factors.find((f) => f.status === "verified");
    return { required: true, factorId: verified?.id };
  }
  return { required: false };
}

/** Verifies a 6-digit code during login to step up the session to aal2. */
export async function verifyLoginChallenge(factorId: string, code: string) {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;
  const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (verifyError) throw verifyError;
}
