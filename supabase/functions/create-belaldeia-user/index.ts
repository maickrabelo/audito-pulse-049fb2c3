import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const companyId = "5c089aac-a898-4d41-9c02-e07f3ae43ea1";
    const email = "dp3@ampadministradora.com.br";
    const cnpjDigits = "15179494000190";
    const companyName = "CONDOMINIO BELALDEIA FLAMBOYANT - MODULO III";

    // Create auth user
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: cnpjDigits,
      email_confirm: true,
      user_metadata: { full_name: companyName },
    });

    if (createUserError) {
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // Update profile
    await supabaseAdmin.from("profiles").update({
      company_id: companyId,
      must_change_password: true,
      full_name: companyName,
    }).eq("id", userId);

    // Update role to company
    await supabaseAdmin.from("user_roles").update({ role: "company" }).eq("user_id", userId);

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      message: `Usuário criado. Email: ${email}, Senha: ${cnpjDigits}`,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
