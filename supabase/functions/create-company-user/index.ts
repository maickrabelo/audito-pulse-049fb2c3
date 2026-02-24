import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseCaller = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseCaller.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller has role 'sst' or 'admin'
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .single();

    if (!callerRole || !["sst", "admin"].includes(callerRole.role)) {
      return new Response(
        JSON.stringify({ error: "Sem permissão. Apenas gestores SST ou admins podem criar usuários de empresa." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { company_id, email, cnpj, company_name } = await req.json();

    if (!company_id || !email || !cnpj) {
      return new Response(
        JSON.stringify({ error: "company_id, email e cnpj são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract digits only from CNPJ for password
    const cnpjDigits = cnpj.replace(/\D/g, "");
    if (cnpjDigits.length < 11) {
      return new Response(
        JSON.stringify({ error: "CNPJ deve ter pelo menos 11 dígitos numéricos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user with CNPJ as password
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: cnpjDigits,
      email_confirm: true,
      user_metadata: {
        full_name: company_name || "Empresa",
      },
    });

    if (createUserError) {
      console.error("Error creating user:", createUserError);

      if (createUserError.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado no sistema." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${createUserError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;

    // Update profile with company_id and must_change_password flag
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        company_id: company_id,
        must_change_password: true,
        full_name: company_name || "Empresa",
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Don't fail completely - user was created
    }

    // Update user role from 'pending' to 'company'
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "company" })
      .eq("user_id", userId);

    if (roleError) {
      console.error("Error updating role:", roleError);
      // Try inserting if update didn't match
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "company" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: `Usuário criado com sucesso. Senha inicial: CNPJ (${cnpjDigits.substring(0, 4)}****)`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
