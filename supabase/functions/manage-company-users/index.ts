import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = ["apurador", "comite", "dpo", "visualizador"] as const;
type MemberRole = (typeof ALLOWED_ROLES)[number];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return out + "@1";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autenticado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseCaller = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } =
      await supabaseCaller.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return json({ error: "Sessão inválida" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const [{ data: callerRoles }, { data: callerProfile }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", callerId),
      admin.from("profiles").select("company_id, full_name").eq("id", callerId).maybeSingle(),
    ]);

    const roles = (callerRoles ?? []).map((r: { role: string }) => r.role);
    const isPrincipal = roles.includes("company");
    const companyId = callerProfile?.company_id ?? null;

    if (!isPrincipal || !companyId) {
      return json(
        { error: "Apenas o usuário principal da empresa pode gerenciar usuários." },
        403,
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "list";

    // ---- LIST ----
    if (action === "list") {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("company_id", companyId);

      const ids = (profiles ?? []).map((p: { id: string }) => p.id);
      if (ids.length === 0) return json({ users: [] });

      const { data: rolesRows } = await admin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);

      const roleMap = new Map<string, string>();
      for (const r of rolesRows ?? []) roleMap.set(r.user_id, r.role);

      const users = [] as unknown[];
      for (const p of profiles ?? []) {
        const { data: authUser } = await admin.auth.admin.getUserById(p.id);
        users.push({
          id: p.id,
          full_name: p.full_name,
          email: authUser?.user?.email ?? null,
          role: roleMap.get(p.id) ?? null,
          created_at: p.created_at,
        });
      }

      return json({ users });
    }

    // ---- CREATE ----
    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const fullName = String(body.full_name ?? "").trim();
      const role = String(body.role ?? "") as MemberRole;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: "E-mail inválido" }, 400);
      }
      if (!fullName || fullName.length > 120) {
        return json({ error: "Nome é obrigatório" }, 400);
      }
      if (!ALLOWED_ROLES.includes(role)) {
        return json({ error: "Tipo de usuário inválido" }, 400);
      }

      // Enforce 1 user per type per company
      const { data: companyProfiles } = await admin
        .from("profiles")
        .select("id")
        .eq("company_id", companyId);
      const ids = (companyProfiles ?? []).map((p: { id: string }) => p.id);
      if (ids.length > 0) {
        const { data: existing } = await admin
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", ids)
          .eq("role", role);
        if ((existing ?? []).length > 0) {
          return json(
            { error: "Já existe um usuário deste tipo nesta empresa." },
            409,
          );
        }
      }

      const password = randomPassword();
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

      if (createError) {
        if (createError.message?.includes("already been registered")) {
          return json({ error: "Este e-mail já está cadastrado." }, 409);
        }
        return json({ error: `Erro ao criar usuário: ${createError.message}` }, 500);
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
      if (roleErr) {
        await admin.from("user_roles").insert({ user_id: newId, role });
      }

      return json({ success: true, user_id: newId, email, password });
    }

    // ---- RESET PASSWORD ----
    if (action === "reset_password") {
      const userId = String(body.user_id ?? "");
      if (!userId) return json({ error: "user_id é obrigatório" }, 400);

      const { data: target } = await admin
        .from("profiles")
        .select("company_id")
        .eq("id", userId)
        .maybeSingle();
      if (!target || target.company_id !== companyId || userId === callerId) {
        return json({ error: "Usuário não pertence à sua empresa." }, 403);
      }

      const password = randomPassword();
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 500);
      await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);

      return json({ success: true, password });
    }

    // ---- DELETE ----
    if (action === "delete") {
      const userId = String(body.user_id ?? "");
      if (!userId) return json({ error: "user_id é obrigatório" }, 400);
      if (userId === callerId) {
        return json({ error: "Você não pode remover o usuário principal." }, 400);
      }

      const [{ data: target }, { data: targetRoles }] = await Promise.all([
        admin.from("profiles").select("company_id").eq("id", userId).maybeSingle(),
        admin.from("user_roles").select("role").eq("user_id", userId),
      ]);

      const tRoles = (targetRoles ?? []).map((r: { role: string }) => r.role);
      if (!target || target.company_id !== companyId) {
        return json({ error: "Usuário não pertence à sua empresa." }, 403);
      }
      if (!tRoles.some((r) => (ALLOWED_ROLES as readonly string[]).includes(r))) {
        return json({ error: "Este usuário não pode ser removido." }, 403);
      }

      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 500);

      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("manage-company-users error", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
