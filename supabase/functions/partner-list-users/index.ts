// API de consulta: o app parceiro lista os usuários de uma empresa e seus status.
import {
  adminClient,
  checkApiKey,
  corsHeaders,
  json,
  ROLE_LABELS,
} from "../_shared/partner-integration.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json({ error: "Método não permitido" }, 405);
  }
  if (!checkApiKey(req)) {
    return json({ error: "Não autorizado" }, 401);
  }

  try {
    const url = new URL(req.url);
    const companyIdParam = url.searchParams.get("company_id");
    const cnpjParam = url.searchParams.get("cnpj");
    const statusParam = url.searchParams.get("status");

    if (!companyIdParam && !cnpjParam) {
      return json({ error: "Informe company_id ou cnpj" }, 400);
    }

    const admin = adminClient();

    let company: { id: string; name: string; cnpj: string | null } | null = null;
    if (companyIdParam) {
      const { data } = await admin
        .from("companies")
        .select("id, name, cnpj")
        .eq("id", companyIdParam)
        .maybeSingle();
      company = data;
    }
    if (!company && cnpjParam) {
      const digits = cnpjParam.replace(/\D/g, "");
      const { data } = await admin
        .from("companies")
        .select("id, name, cnpj")
        .or(`slug.eq.${digits},cnpj.eq.${digits}`)
        .limit(1)
        .maybeSingle();
      company = data;
    }
    if (!company) return json({ error: "Empresa não encontrada" }, 404);

    let query = admin
      .from("company_user_invites")
      .select(
        "user_id, external_user_id, email, full_name, role, status, expires_at, accepted_at, created_at",
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (statusParam) query = query.eq("status", statusParam);

    const { data: rows, error } = await query;
    if (error) {
      console.error("partner-list-users query error", error);
      return json({ error: "Erro ao consultar usuários" }, 500);
    }

    return json({
      success: true,
      company: { id: company.id, name: company.name, cnpj: company.cnpj },
      total: (rows ?? []).length,
      users: (rows ?? []).map((r) => ({
        user_id: r.user_id,
        external_user_id: r.external_user_id,
        full_name: r.full_name,
        email: r.email,
        role: r.role,
        role_label: ROLE_LABELS[r.role] ?? r.role,
        status: r.status,
        invited_at: r.created_at,
        invite_expires_at: r.expires_at,
        activated_at: r.accepted_at,
      })),
    });
  } catch (e) {
    console.error("partner-list-users error", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
