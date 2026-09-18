// Shared helpers for the partner user-management integration.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const APP_URL =
  Deno.env.get("APP_PUBLIC_URL") ?? "https://ouvidoriaamo.agenciamundi.com";

export const MEMBER_ROLES = ["apurador", "comite", "dpo", "visualizador"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  apurador: "RH / Apurador",
  comite: "Comitê de Ética",
  dpo: "DPO interno",
  visualizador: "Visualizador",
  gestor_usuarios: "Gestor de usuários",
  company: "Usuário principal",
};

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function checkApiKey(req: Request): boolean {
  const provided = req.headers.get("x-api-key");
  if (!provided) return false;
  const expected = [
    Deno.env.get("PARTNER_API_KEY"),
    Deno.env.get("CREATE_COMPANY_API_KEY"),
  ].filter(Boolean) as string[];
  return expected.some((k) => k === provided);
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  return out + "@1";
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Sends the invitation e-mail through Resend. */
export async function sendInviteEmail(opts: {
  to: string;
  fullName: string | null;
  companyName: string;
  roleLabel: string;
  token: string;
  isManager: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY não configurada" };

  const link = `${APP_URL}/convite?token=${opts.token}`;
  const greeting = opts.fullName ? `Olá, ${opts.fullName}!` : "Olá!";
  const intro = opts.isManager
    ? `Você foi cadastrado como <strong>gestor de usuários</strong> da Ouvidoria AMO da empresa <strong>${opts.companyName}</strong>. Nesse perfil você cadastra e acompanha os usuários que terão acesso ao canal.`
    : `Você foi convidado para acessar a Ouvidoria AMO da empresa <strong>${opts.companyName}</strong> com o perfil <strong>${opts.roleLabel}</strong>.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color:#222;">
      <h1 style="color:#0b5d3b; border-bottom:2px solid #0b5d3b; padding-bottom:10px;">Ouvidoria AMO</h1>
      <p>${greeting}</p>
      <p>${intro}</p>
      <p>Para concluir o cadastro, crie sua senha de acesso:</p>
      <p style="margin:28px 0;">
        <a href="${link}" style="background:#0b5d3b;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">Criar minha senha</a>
      </p>
      <p style="font-size:13px;color:#666;">Se o botão não funcionar, copie e cole este endereço no navegador:<br>${link}</p>
      <p style="font-size:13px;color:#666;">Este convite expira em 7 dias. Se você não esperava este e-mail, ignore-o.</p>
      <div style="margin-top:30px;padding-top:16px;border-top:1px solid #ddd;color:#999;font-size:12px;">
        E-mail automático — Ouvidoria AMO.
      </div>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ouvidoria AMO <onboarding@resend.dev>",
        to: [opts.to],
        subject: `Convite de acesso — Ouvidoria AMO (${opts.companyName})`,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Resend failed [${res.status}]: ${text}`);
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("Resend request error", e);
    return { ok: false, error: String(e) };
  }
}

export interface PartnerUserEvent {
  event:
    | "user.invited"
    | "user.activated"
    | "user.invite_resent"
    | "user.revoked";
  company_id: string;
  company_cnpj?: string | null;
  company_name?: string | null;
  user_id: string | null;
  external_user_id?: string | null;
  full_name: string | null;
  email: string;
  role: string;
  status: "pending" | "active" | "revoked";
  occurred_at: string;
}

/**
 * Sends the status event to the partner app (signed with HMAC-SHA256)
 * and records the delivery attempt for auditing. Never throws.
 */
export async function notifyPartner(event: PartnerUserEvent): Promise<void> {
  const admin = adminClient();
  const url = Deno.env.get("PARTNER_WEBHOOK_URL");
  const secret = Deno.env.get("PARTNER_WEBHOOK_SECRET");

  if (!url) {
    await admin.from("integration_webhook_deliveries").insert({
      event: event.event,
      target_url: null,
      payload: event as unknown as Record<string, unknown>,
      status: "skipped",
      response_body: "PARTNER_WEBHOOK_URL não configurada",
    });
    return;
  }

  const bodyText = JSON.stringify(event);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) {
    headers["X-Signature-256"] = `sha256=${await hmacSha256(secret, bodyText)}`;
  }

  let attempts = 0;
  let status = "failed";
  let responseStatus: number | null = null;
  let responseBody = "";

  while (attempts < 3) {
    attempts++;
    try {
      const res = await fetch(url, { method: "POST", headers, body: bodyText });
      responseStatus = res.status;
      responseBody = (await res.text()).slice(0, 2000);
      if (res.ok) {
        status = "delivered";
        break;
      }
    } catch (e) {
      responseBody = String(e).slice(0, 2000);
    }
    if (attempts < 3) await new Promise((r) => setTimeout(r, 500 * attempts));
  }

  await admin.from("integration_webhook_deliveries").insert({
    event: event.event,
    target_url: url,
    payload: event as unknown as Record<string, unknown>,
    status,
    attempts,
    response_status: responseStatus,
    response_body: responseBody,
    last_attempt_at: new Date().toISOString(),
  });
}
