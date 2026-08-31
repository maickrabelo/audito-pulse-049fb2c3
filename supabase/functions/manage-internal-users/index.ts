import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: userData } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    const caller = userData?.user;
    if (!caller) return json({ error: "Sessão inválida" }, 401);

    const { data: callerRoles } = await admin
      .from("user_roles").select("role").eq("user_id", caller.id);
    const isMaster = (callerRoles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isMaster) return json({ error: "Apenas o usuário master pode gerenciar usuários internos." }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "list";

    // ---- LIST ----
    if (action === "list") {
      const { data: internos } = await admin
        .from("internal_users")
        .select("id, user_id, full_name, cpf, email, created_at")
        .order("created_at", { ascending: false });

      const ids = (internos ?? []).map((u: { user_id: string }) => u.user_id);

      let tratativas: Record<string, number> = {};
      if (ids.length) {
        const { data: versoes } = await admin
          .from("classificacao_versoes")
          .select("autor_id")
          .in("autor_id", ids);
        for (const v of versoes ?? []) {
          const k = (v as { autor_id: string }).autor_id;
          tratativas[k] = (tratativas[k] ?? 0) + 1;
        }
      }

      return json({
        users: (internos ?? []).map((u: Record<string, unknown>) => ({
          ...u,
          tratamentos: tratativas[u.user_id as string] ?? 0,
        })),
      });
    }

    // ---- CREATE ----
    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const fullName = String(body.full_name ?? "").trim();
      const cpf = String(body.cpf ?? "").replace(/\D/g, "");

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "E-mail inválido" }, 400);
      if (!fullName || fullName.length > 120) return json({ error: "Nome é obrigatório" }, 400);
      if (cpf.length !== 11) return json({ error: "CPF deve ter 11 dígitos" }, 400);

      const { data: dup } = await admin
        .from("internal_users").select("id").eq("cpf", cpf).maybeSingle();
      if (dup) return json({ error: "Já existe um usuário interno com este CPF." }, 409);

      const password = randomPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
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

      await admin.from("profiles")
        .update({ full_name: fullName, must_change_password: true })
        .eq("id", newId);

      const { error: roleErr } = await admin
        .from("user_roles").update({ role: "triador_sst" }).eq("user_id", newId);
      if (roleErr) await admin.from("user_roles").insert({ user_id: newId, role: "triador_sst" });

      const { error: insErr } = await admin.from("internal_users").insert({
        user_id: newId, full_name: fullName, cpf, email, created_by: caller.id,
      });
      if (insErr) return json({ error: insErr.message }, 500);

      return json({ success: true, user_id: newId, email, password });
    }

    // ---- RESET PASSWORD ----
    if (action === "reset_password") {
      const userId = String(body.user_id ?? "");
      const { data: target } = await admin
        .from("internal_users").select("user_id").eq("user_id", userId).maybeSingle();
      if (!target) return json({ error: "Usuário interno não encontrado." }, 404);

      const password = randomPassword();
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 500);
      await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);
      return json({ success: true, password });
    }

    // ---- DELETE ----
    if (action === "delete") {
      const userId = String(body.user_id ?? "");
      if (userId === caller.id) return json({ error: "Você não pode remover a si mesmo." }, 400);
      const { data: target } = await admin
        .from("internal_users").select("user_id").eq("user_id", userId).maybeSingle();
      if (!target) return json({ error: "Usuário interno não encontrado." }, 404);

      await admin.from("internal_users").delete().eq("user_id", userId);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("manage-internal-users error", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
