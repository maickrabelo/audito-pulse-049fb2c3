// Endpoint público: valida o token do convite e define a senha do usuário.
import {
  adminClient,
  corsHeaders,
  json,
  notifyPartner,
  ROLE_LABELS,
  sha256,
} from "../_shared/partner-integration.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "accept");
    const token = String(body.token ?? "");
    if (!token || token.length < 32) {
      return json({ error: "Convite inválido." }, 400);
    }

    const admin = adminClient();
    const tokenHash = await sha256(token);

    const { data: invite } = await admin
      .from("company_user_invites")
      .select("id, company_id, user_id, email, full_name, role, status, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!invite || invite.status === "revoked") {
      return json({ error: "Convite inválido ou já utilizado." }, 404);
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return json({ error: "Este convite expirou. Solicite um novo." }, 410);
    }

    const { data: company } = await admin
      .from("companies")
      .select("id, name, cnpj")
      .eq("id", invite.company_id)
      .maybeSingle();

    // ---- VERIFY (carregar dados para a tela) ----
    if (action === "verify") {
      return json({
        valid: true,
        email: invite.email,
        full_name: invite.full_name,
        role: invite.role,
        role_label: ROLE_LABELS[invite.role] ?? invite.role,
        company_name: company?.name ?? null,
        status: invite.status,
      });
    }

    // ---- ACCEPT ----
    const password = String(body.password ?? "");
    if (password.length < 8) {
      return json({ error: "A senha deve ter pelo menos 8 caracteres." }, 400);
    }
    if (!invite.user_id) {
      return json({ error: "Convite sem usuário vinculado." }, 400);
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      invite.user_id,
      { password, email_confirm: true },
    );
    if (updateError) {
      console.error("accept-invite update error", updateError);
      return json({ error: "Não foi possível definir a senha." }, 500);
    }

    await admin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", invite.user_id);

    await admin
      .from("company_user_invites")
      .update({
        status: "active",
        token_hash: null,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    await notifyPartner({
      event: "user.activated",
      company_id: invite.company_id,
      company_cnpj: company?.cnpj ?? null,
      company_name: company?.name ?? null,
      user_id: invite.user_id,
      full_name: invite.full_name,
      email: invite.email,
      role: invite.role,
      status: "active",
      occurred_at: new Date().toISOString(),
    });

    return json({ success: true, email: invite.email, status: "active" });
  } catch (e) {
    console.error("accept-invite error", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
