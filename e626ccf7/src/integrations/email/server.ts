import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const RESEND_API = "https://api.resend.com/emails";
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;

export type OtpPurpose = "signup" | "email";

function serverSupabase() {
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) return null;
  return createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
}

type ServerClient = NonNullable<ReturnType<typeof serverSupabase>>;

export type PartnerRole = "shopkeeper" | "service_provider" | "rider";

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(bytes: number): string {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(values)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomSixDigitCode(): string {
  const values = crypto.getRandomValues(new Uint32Array(1));
  return String((values[0] ?? 0) % 1_000_000).padStart(6, "0");
}

async function sendViaResend(to: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return { ok: false };

  const from = process.env["RESEND_FROM"] ?? "NextNab <onboarding@resend.dev>";
  const response = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${code} is your NextNab verification code`,
      html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:#5300b7">NextNab</div>
          <p style="margin:20px 0 4px;color:#3f3f46;font-size:14px">Your verification code is</p>
          <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#18181b;margin:12px 0">${code}</div>
          <p style="color:#71717a;font-size:12px;margin-top:20px">
            This code expires in 10 minutes. If you didn't request it, ignore this email.
          </p>
        </div>`,
    }),
  });
  if (response.ok) return { ok: true };
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return { ok: false, error: body?.message ?? `Email provider error (${response.status})` };
}

/**
 * Tells the client whether the 6-digit code pipeline is live, so the UI only
 * offers code-based login when codes can actually be emailed.
 */
export const getEmailAuthConfig = createServerFn({ method: "GET" }).handler(() => ({
  otpEmail: Boolean(process.env["RESEND_API_KEY"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]),
}));

async function issueEmailCode(
  supabase: ServerClient,
  email: string,
  purpose: OtpPurpose,
): Promise<{ ok: boolean; error?: string }> {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();

  const { count, error: countError } = await supabase
    .from("email_otps")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("purpose", purpose)
    .gte("created_at", windowStart);
  if (countError) throw countError;
  if ((count ?? 0) >= RATE_LIMIT) {
    throw new Error("Too many codes requested. Please try again in a few minutes.");
  }

  const code = randomSixDigitCode();
  const salt = randomHex(8);
  const codeHash = `${salt}:${await sha256Hex(salt + code)}`;

  const { error: deleteError } = await supabase
    .from("email_otps")
    .delete()
    .eq("email", email)
    .eq("purpose", purpose);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase.from("email_otps").insert({
    email,
    purpose,
    code_hash: codeHash,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (insertError) throw insertError;

  return sendViaResend(email, code);
}

async function consumeEmailCode(
  supabase: ServerClient,
  email: string,
  purpose: OtpPurpose,
  code: string,
): Promise<void> {
  const { data: rows, error: selectError } = await supabase
    .from("email_otps")
    .select("id, code_hash, expires_at, attempts")
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  if (selectError) throw selectError;

  const row = rows?.[0];
  if (!row) throw new Error("Request a new code first.");
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error("That code has expired. Request a new one.");
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many wrong attempts. Request a new code.");
  }

  const [salt, expected] = row.code_hash.split(":");
  const actual = await sha256Hex((salt ?? "") + code);
  if (expected !== actual) {
    await supabase
      .from("email_otps")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    throw new Error("Incorrect code. Check the email and try again.");
  }

  await supabase
    .from("email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id);
}

/**
 * Generates and emails a 6-digit code. Returns sent:false when no email
 * provider is configured so the client can fall back to Supabase's mailer.
 */
export const requestEmailOtp = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), purpose: z.enum(["signup", "email"]) }))
  .handler(async ({ data }) => {
    const supabase = serverSupabase();
    if (!supabase || !process.env["RESEND_API_KEY"]) {
      return { sent: false, available: false };
    }
    const email = data.email.toLowerCase().trim();
    const result = await issueEmailCode(supabase, email, data.purpose);
    return { sent: result.ok, available: true, error: result.error };
  });

/**
 * Checks a code, then either confirms the new signup's email or issues a
 * magic-link the client follows to establish a passwordless session.
 */
export const verifyEmailOtp = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      purpose: z.enum(["signup", "email"]),
      code: z.string().length(6),
      userId: z.string().uuid().optional(),
      redirectTo: z.string().url().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = serverSupabase();
    if (!supabase) {
      throw new Error("Email verification is not configured on this server yet.");
    }
    const email = data.email.toLowerCase().trim();

    await consumeEmailCode(supabase, email, data.purpose, data.code);

    if (data.purpose === "signup") {
      if (!data.userId) throw new Error("Account not found for this email.");
      const { error } = await supabase.auth.admin.updateUserById(data.userId, {
        email_confirm: true,
      });
      if (error) throw error;
      return { actionLink: null };
    }

    const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      // Without an explicit redirectTo Supabase falls back to the project's
      // site URL, which strands the user off-app after code verification.
      ...(data.redirectTo ? { options: { redirectTo: data.redirectTo } } : {}),
    });
    if (linkError) throw linkError;
    return { actionLink: link.properties.action_link };
  });

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  const head = (name ?? "").slice(0, 2);
  return `${head}•••@${domain ?? "email"}`;
}

/**
 * Partners sign in with their registered phone number, but codes travel over
 * the email pipeline (no SMS provider is configured), so resolve phone → user
 * → account email server-side. The email never reaches the browser.
 */
async function resolvePartnerEmail(
  supabase: ServerClient,
  phone: string,
  role: PartnerRole,
): Promise<string | null> {
  const candidates: string[] = [];

  const { data: applications } = await supabase
    .from("partner_applications")
    .select("user_id, partner_type")
    .eq("phone", phone)
    .order("created_at", { ascending: false });
  for (const application of applications ?? []) {
    if (application.partner_type === role) candidates.push(application.user_id);
  }
  for (const application of applications ?? []) candidates.push(application.user_id);

  const { data: rider } = await supabase
    .from("riders")
    .select("user_id")
    .eq("phone", phone)
    .maybeSingle();
  if (rider?.user_id) candidates.push(rider.user_id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (profile?.id) candidates.push(profile.id);

  for (const userId of candidates) {
    const { data } = await supabase.auth.admin.getUserById(userId);
    if (data.user?.email) return data.user.email;
  }
  return null;
}

const partnerOtpInput = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  role: z.enum(["shopkeeper", "service_provider", "rider"]),
});

/**
 * Emails a login code to the account registered against a partner phone
 * number. Returns a masked address so the UI can say where the code went.
 */
export const requestPartnerOtp = createServerFn({ method: "POST" })
  .validator(partnerOtpInput)
  .handler(async ({ data }) => {
    const supabase = serverSupabase();
    if (!supabase || !process.env["RESEND_API_KEY"]) {
      return { sent: false, available: false, maskedEmail: null, error: null as string | null };
    }
    const email = await resolvePartnerEmail(supabase, data.phone, data.role);
    if (!email) {
      return {
        sent: false,
        available: true,
        maskedEmail: null,
        error: "No partner account found for this number. Create an account first.",
      };
    }
    const result = await issueEmailCode(supabase, email, "email");
    return {
      sent: result.ok,
      available: true,
      maskedEmail: maskEmail(email),
      error: result.error ?? null,
    };
  });

/**
 * Checks a partner login code and issues a magic link that establishes the
 * session, mirroring verifyEmailOtp without exposing the account email.
 */
export const verifyPartnerOtp = createServerFn({ method: "POST" })
  .validator(
    partnerOtpInput.extend({
      code: z.string().length(6),
      redirectTo: z.string().url().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = serverSupabase();
    if (!supabase) {
      throw new Error("Email verification is not configured on this server yet.");
    }
    const email = await resolvePartnerEmail(supabase, data.phone, data.role);
    if (!email) throw new Error("No partner account found for this number.");

    await consumeEmailCode(supabase, email, "email", data.code);

    const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      ...(data.redirectTo ? { options: { redirectTo: data.redirectTo } } : {}),
    });
    if (linkError) throw linkError;
    return { actionLink: link.properties.action_link };
  });
