import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignContractRequest {
  partner_id?: string;
  partnerId?: string;
  type: "partner" | "affiliate";
  terms_accepted?: boolean;
  termsAccepted?: boolean;
  signature_data?: {
    ip_address?: string;
    user_agent?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: SignContractRequest = await req.json();
    
    // Accept both partnerId and partner_id
    const partner_id = requestData.partner_id || requestData.partnerId;
    const type = requestData.type;
    const terms_accepted = requestData.terms_accepted ?? requestData.termsAccepted ?? true;
    const signature_data = requestData.signature_data;

    console.log(`Processing contract signature for ${type}: ${partner_id}`);

    if (!partner_id) {
      throw new Error("ID do parceiro/afiliado não informado");
    }

    const tableName = type === "partner" ? "licensed_partners" : "affiliates";

    // Fetch current data
    const { data: partnerData, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", partner_id)
      .single();

    if (fetchError || !partnerData) {
      throw new Error(`${type === "partner" ? "Parceiro" : "Afiliado"} não encontrado`);
    }

    if (partnerData.contract_signed) {
      throw new Error("Contrato já foi assinado anteriormente");
    }

    // Get client IP from request headers
    const clientIP = signature_data?.ip_address || 
      req.headers.get("x-forwarded-for")?.split(",")[0] || 
      req.headers.get("x-real-ip") || 
      "unknown";

    const now = new Date().toISOString();

    // Update with signature info
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        contract_signed: true,
        contract_signed_at: now,
        contract_signed_ip: clientIP,
        terms_accepted: true,
        terms_accepted_at: now,
        status: "pending_approval",
      })
      .eq("id", partner_id);

    if (updateError) {
      console.error("Error updating signature:", updateError);
      throw new Error("Erro ao registrar assinatura");
    }

    // Send confirmation email
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-partner-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        email: partnerData.email,
        name: type === "partner" ? partnerData.razao_social : partnerData.nome_completo,
        type: type,
        email_type: "registration_pending",
      }),
    });

    console.log("Confirmation email sent:", await emailResponse.json());

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contrato assinado com sucesso",
        signed_at: now,
        ip_address: clientIP,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error signing contract:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
