import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  company_id: string;
  tracking_code: string;
  title: string;
  category: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { company_id, tracking_code, title, category }: NotificationRequest = await req.json();

    console.log("Sending notification for report:", tracking_code);

    // Buscar dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, email, notification_email_1, notification_email_2, notification_email_3')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      console.error('Error fetching company:', companyError);
      return new Response(
        JSON.stringify({ success: false, error: "Empresa não encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Coletar todos os emails configurados
    const emailAddresses = [
      company.email,
      company.notification_email_1,
      company.notification_email_2,
      company.notification_email_3
    ].filter(email => email && email.trim() !== '');

    if (emailAddresses.length === 0) {
      console.log('Company has no email configured, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: "Empresa sem email configurado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Sending notification to ${emailAddresses.length} email(s):`, emailAddresses);

    // Enviar email para todos os endereços configurados
    const emailResponse = await resend.emails.send({
      from: "Canal de Denúncias <onboarding@resend.dev>",
      to: emailAddresses,
      subject: `Nova Denúncia Recebida - ${tracking_code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            Nova Denúncia Recebida
          </h1>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 10px 0;"><strong>Empresa:</strong> ${company.name}</p>
            <p style="margin: 10px 0;"><strong>Código de Rastreamento:</strong> ${tracking_code}</p>
            <p style="margin: 10px 0;"><strong>Título:</strong> ${title}</p>
            <p style="margin: 10px 0;"><strong>Categoria:</strong> ${category}</p>
          </div>
          
          <p style="color: #666; margin: 20px 0;">
            Uma nova denúncia foi registrada no sistema. 
            Acesse o painel administrativo para visualizar os detalhes completos e tomar as providências necessárias.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
            <p>Este é um email automático do Canal de Denúncias.</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado com sucesso" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
