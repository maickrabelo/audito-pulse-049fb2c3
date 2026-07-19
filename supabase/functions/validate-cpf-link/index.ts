import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashCpf(cpf: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + cpf);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { company_id, cpf } = await req.json();
    const digits = (cpf || "").replace(/\D/g, "");
    if (!company_id || digits.length !== 11) {
      return new Response(JSON.stringify({ error: "company_id e CPF (11 dígitos) obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const salt = Deno.env.get("CPF_HASH_SALT");
    if (!salt) return new Response(JSON.stringify({ error: "CPF_HASH_SALT ausente" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const cpf_hash = await hashCpf(digits, salt);

    const { data, error } = await supabase
      .from("soc_employees")
      .select("unidade, setor, ghe, cargo, cbo, situacao")
      .eq("company_id", company_id)
      .eq("cpf_hash", cpf_hash)
      .maybeSingle();

    if (error) throw error;

    // NUNCA retorna o CPF nem armazena a consulta.
    if (!data) {
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      found: true,
      snapshot: {
        unidade: data.unidade,
        setor: data.setor,
        ghe: data.ghe,
        cargo: data.cargo,
        cbo: data.cbo,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
