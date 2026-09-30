// Painel do gestor de usuários: listar, convidar, reenviar convite e revogar acesso.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  adminClient,
  corsHeaders,
  isValidEmail,
  json,
  MEMBER_ROLES,
  notifyPartner,
  randomPassword,
  randomToken,
  ROLE_LABELS,
  sendInviteEmail,
  sha256,
  type MemberRole,
} from "../_shared/partner-integration.ts";

const INVITE_DAYS = 7;
const MANAGER_ROLES = ["company", "gestor_usuarios", "admin"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autenticado" }, 401);
    }

    const caller = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsError } = await caller.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsError || !claimsData?.claims?.sub) {
      return json({ error: "Sessão inválida" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    const admin = adminClient();
    const [{ data: callerRoles }, { data: callerProfile }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", callerId),
      admin.from("profiles").select("company_id").eq("id", callerId).maybeSingle(),
    ]);

    const roles = (callerRoles ?? []).map((r: { role: string }) => r.role);
    const isAdmin = roles.includes("admin");
    if (!roles.some((r) => MANAGER_ROLES.includes(r))) {
      return json({ error: "Sem permissão para gerenciar usuários." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");
    // Admin sem empresa vinculada pode agir informando company_id no corpo.
    const companyId = callerProfile?.company_id ?? (isAdmin ? String(body.company_id ?? "") || null : null);
    if (!companyId) {
      return json({ error: "Sem permissão para gerenciar usuários." }, 403);
    }

    const { data: company } = await admin
      .from("companies")
      .select("id, name, cnpj")
      .eq("id", companyId)
      .maybeSingle();
    if (!company) return json({ error: "Empresa não encontrada" }, 404);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");

    const loadUsers = async () => {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("company_id", companyId);
      const ids = (profiles ?? []).map((p: { id: string }) => p.id);
      if (ids.length === 0) return [];

      const [{ data: rolesRows }, { data: invites }] = await Promise.all([
        admin.from("user_roles").select("user_id, role").in("user_id", ids),
        admin
          .from("company_user_invites")
          .select("user_id, email, status, expires_at, created_at")
          .eq("company_id", companyId),
      ]);

      const roleMap = new Map<string, string>();
      for (const r of rolesRows ?? []) roleMap.set(r.user_id, r.role);
      const inviteMap = new Map<string, Record<string, unknown>>();
      for (const i of invites ?? []) if (i.user_id) inviteMap.set(i.user_id, i);

      const out: unknown[] = [];
      for (const p of profiles ?? []) {
        const role = roleMap.get(p.id) ?? null;
        if (!role || !["apurador", "comite", "dpo", "visualizador", "gestor_usuarios"].includes(role)) {
          continue;
        }
        const { data: authUser } = await admin.auth.admin.getUserById(p.id);
        const invite = inviteMap.get(p.id) as
          | { status?: string; email?: string; expires_at?: string }
          | undefined;
        out.push({
          id: p.id,
          full_name: p.full_name,
          email: authUser?.user?.email ?? invite?.email ?? null,
          role,
          role_label: ROLE_LABELS[role] ?? role,
          status: invite?.status ?? "active",
          invite_expires_at: invite?.expires_at ?? null,
          created_at: p.created_at,
        });
      }
      return out;
    };

    // ---- LIST ----
    if (action === "list") {
      return json({ company: { id: company.id, name: company.name }, users: await loadUsers() });
    }

    // ---- INVITE ----
    if (action === "invite") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const fullName = String(body.full_name ?? "").trim();
      const role = String(body.role ?? "") as MemberRole;

      if (!isValidEmail(email)) return json({ error: "E-mail inválido" }, 400);
      if (!fullName || fullName.length > 120) {
        return json({ error: "Nome é obrigatório" }, 400);
      }
      if (!(MEMBER_ROLES as readonly string[]).includes(role)) {
        return json({ error: "Tipo de usuário inválido" }, 400);
      }

      // 1 usuário por tipo por empresa
      const { data: companyProfiles } = await admin
        .from("profiles")
        .select("id")
        .eq("company_id", companyId);
      const ids = (companyProfiles ?? []).map((p: { id: string }) => p.id);
      if (ids.length > 0) {
        const { data: existing } = await admin
          .from("user_roles")
          .select("user_id")
          .in("user_id", ids)
          .eq("role", role);
        if ((existing ?? []).length > 0) {
          return json({ error: "Já existe um usuário deste tipo nesta empresa." }, 409);
        }
      }

      const { data: created, error: createError } = await admin.auth.admin
        .createUser({
          email,
          password: randomPassword(),
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
      if (createError || !created?.user) {
        if (createError?.message?.includes("already been registered")) {
          return json({ error: "Este e-mail já está cadastrado." }, 409);
        }
        return json({ error: `Erro ao criar usuário: ${createError?.message}` }, 500);
      }
      const newId = created.user.id;

      await admin
        .from("profiles")
        .update({ company_id: companyId, full_name: fullName, must_change_password: true })
        .eq("id", newId);
      const { error: roleErr } = await admin
        .from("user_roles")
        .update({ role })
        .eq("user_id", newId);
      if (roleErr) await admin.from("user_roles").insert({ user_id: newId, role });

      const token = randomToken();
      const expiresAt = new Date(Date.now() + INVITE_DAYS * 86400000).toISOString();
      await admin.from("company_user_invites").insert({
        company_id: companyId,
        user_id: newId,
        email,
        full_name: fullName,
        role,
        status: "pending",
        token_hash: await sha256(token),
        expires_at: expiresAt,
        invited_by: callerId,
      });

      const mail = await sendInviteEmail({
        to: email,
        fullName,
        companyName: company.name,
        roleLabel: ROLE_LABELS[role] ?? role,
        token,
        isManager: false,
      });

      await notifyPartner({
        event: "user.invited",
        company_id: companyId,
        company_cnpj: company.cnpj,
        company_name: company.name,
        user_id: newId,
        full_name: fullName,
        email,
        role,
        status: "pending",
        occurred_at: new Date().toISOString(),
      });

      return json({
        success: true,
        user_id: newId,
        status: "pending",
        email_sent: mail.ok,
        email_error: mail.ok ? undefined : mail.error,
      });
    }

    // ---- RESEND ----
    if (action === "resend") {
      const userId = String(body.user_id ?? "");
      const { data: invite } = await admin
        .from("company_user_invites")
        .select("id, email, full_name, role, company_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!invite || invite.company_id !== companyId) {
        return json({ error: "Convite não encontrado para esta empresa." }, 404);
      }

      const token = randomToken();
      const expiresAt = new Date(Date.now() + INVITE_DAYS * 86400000).toISOString();
      await admin
        .from("company_user_invites")
        .update({ token_hash: await sha256(token), expires_at: expiresAt, status: "pending" })
        .eq("id", invite.id);

      const mail = await sendInviteEmail({
        to: invite.email,
        fullName: invite.full_name,
        companyName: company.name,
        roleLabel: ROLE_LABELS[invite.role] ?? invite.role,
        token,
        isManager: invite.role === "gestor_usuarios",
      });

      await notifyPartner({
        event: "user.invite_resent",
        company_id: companyId,
        company_cnpj: company.cnpj,
        company_name: company.name,
        user_id: userId,
        full_name: invite.full_name,
        email: invite.email,
        role: invite.role,
        status: "pending",
        occurred_at: new Date().toISOString(),
      });

      return json({ success: true, email_sent: mail.ok, email_error: mail.ok ? undefined : mail.error });
    }

    // ---- REVOKE (remover acesso) ----
    if (action === "revoke") {
      const userId = String(body.user_id ?? "");
      if (!userId || userId === callerId) {
        return json({ error: "Usuário inválido." }, 400);
      }

      const [{ data: target }, { data: targetRoles }] = await Promise.all([
        admin.from("profiles").select("company_id, full_name").eq("id", userId).maybeSingle(),
        admin.from("user_roles").select("role").eq("user_id", userId),
      ]);
      const tRoles = (targetRoles ?? []).map((r: { role: string }) => r.role);
      if (!target || target.company_id !== companyId) {
        return json({ error: "Usuário não pertence à sua empresa." }, 403);
      }
      if (!tRoles.some((r) => (MEMBER_ROLES as readonly string[]).includes(r))) {
        return json({ error: "Este usuário não pode ser removido." }, 403);
      }

      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email ?? "";

      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 500);

      await admin
        .from("company_user_invites")
        .update({ status: "revoked", token_hash: null })
        .eq("user_id", userId);

      await notifyPartner({
        event: "user.revoked",
        company_id: companyId,
        company_cnpj: company.cnpj,
        company_name: company.name,
        user_id: userId,
        full_name: target.full_name,
        email,
        role: tRoles[0] ?? "",
        status: "revoked",
        occurred_at: new Date().toISOString(),
      });

      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("manage-company-invites error", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
