// Webhook de entrada: o app parceiro cria um "gestor de usuários" vinculado a uma empresa.
import {
  adminClient,
  checkApiKey,
  corsHeaders,
  isValidEmail,
  json,
  notifyPartner,
  randomPassword,
  randomToken,
  sendInviteEmail,
  sha256,
} from "../_shared/partner-integration.ts";

const INVITE_DAYS = 7;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }
  if (!checkApiKey(req)) {
    return json({ error: "Não autorizado" }, 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.full_name ?? body.name ?? "").trim();
    const companyId = body.company_id ? String(body.company_id) : null;
    const cnpjDigits = body.cnpj ? String(body.cnpj).replace(/\D/g, "") : null;
    const externalUserId = body.external_user_id
      ? String(body.external_user_id)
      : null;

    if (!email || !isValidEmail(email)) {
      return json({ error: "E-mail inválido" }, 400);
    }
    if (!fullName) return json({ error: "full_name é obrigatório" }, 400);
    if (!companyId && !cnpjDigits) {
      return json({ error: "Informe company_id ou cnpj" }, 400);
    }

    const admin = adminClient();

    // Localizar empresa por id ou CNPJ (slug = CNPJ somente dígitos)
    let company: { id: string; name: string; cnpj: string | null } | null = null;
    if (companyId) {
      const { data } = await admin
        .from("companies")
        .select("id, name, cnpj")
        .eq("id", companyId)
        .maybeSingle();
      company = data;
    }
    if (!company && cnpjDigits) {
      const { data } = await admin
        .from("companies")
        .select("id, name, cnpj")
        .or(`slug.eq.${cnpjDigits},cnpj.eq.${cnpjDigits}`)
        .limit(1)
        .maybeSingle();
      company = data;
    }
    if (!company) {
      return json({ error: "Empresa não encontrada" }, 404);
    }

    // Idempotência: convite já existente para o e-mail
    const { data: existingInvite } = await admin
      .from("company_user_invites")
      .select("id, user_id, status, company_id, role")
      .ilike("email", email)
      .maybeSingle();

    if (existingInvite) {
      return json({
        success: true,
        already_exists: true,
        user_id: existingInvite.user_id,
        invite_id: existingInvite.id,
        company_id: existingInvite.company_id,
        role: existingInvite.role,
        status: existingInvite.status,
      });
    }

    // Criar usuário de autenticação (senha aleatória; definida pelo próprio usuário no convite)
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
      return json(
        { error: `Erro ao criar usuário: ${createError?.message}` },
        500,
      );
    }

    const userId = created.user.id;

    await admin
      .from("profiles")
      .update({
        company_id: company.id,
        full_name: fullName,
        must_change_password: true,
      })
      .eq("id", userId);

    const { error: roleErr } = await admin
      .from("user_roles")
      .update({ role: "gestor_usuarios" })
      .eq("user_id", userId);
    if (roleErr) {
      await admin
        .from("user_roles")
        .insert({ user_id: userId, role: "gestor_usuarios" });
    }

    const token = randomToken();
    const expiresAt = new Date(
      Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: invite } = await admin
      .from("company_user_invites")
      .insert({
        company_id: company.id,
        user_id: userId,
        email,
        full_name: fullName,
        role: "gestor_usuarios",
        status: "pending",
        token_hash: await sha256(token),
        expires_at: expiresAt,
        external_user_id: externalUserId,
      })
      .select("id")
      .single();

    const mail = await sendInviteEmail({
      to: email,
      fullName,
      companyName: company.name,
      roleLabel: "Gestor de usuários",
      token,
      isManager: true,
    });

    await notifyPartner({
      event: "user.invited",
      company_id: company.id,
      company_cnpj: company.cnpj,
      company_name: company.name,
      user_id: userId,
      external_user_id: externalUserId,
      full_name: fullName,
      email,
      role: "gestor_usuarios",
      status: "pending",
      occurred_at: new Date().toISOString(),
    });

    return json({
      success: true,
      user_id: userId,
      invite_id: invite?.id ?? null,
      company_id: company.id,
      role: "gestor_usuarios",
      status: "pending",
      invite_expires_at: expiresAt,
      email_sent: mail.ok,
      email_error: mail.ok ? undefined : mail.error,
    });
  } catch (e) {
    console.error("partner-create-manager error", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
