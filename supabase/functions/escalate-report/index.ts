import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { report_id } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: r } = await supabase.from("reports").select("id, title, tracking_code, company_id").eq("id", report_id).single();
    const { data: c } = await supabase.from("companies").select("name, emergency_contacts, notification_email_1, notification_email_2, notification_email_3").eq("id", r.company_id).single();

    const contacts = Array.isArray(c?.emergency_contacts) ? c.emergency_contacts : [];
    const emails = [
      ...contacts.map((x: any) => x.email).filter(Boolean),
      c?.notification_email_1, c?.notification_email_2, c?.notification_email_3,
    ].filter(Boolean);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY && emails.length) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Ouvidoria AMO <alertas@grupoamo.com.br>",
          to: emails,
          subject: `🚨 ALERTA GRAVE E IMINENTE — Denúncia ${r.tracking_code}`,
          html: `<h2>Alerta de risco grave e iminente</h2>
                 <p>Uma denúncia da empresa <b>${c?.name}</b> foi classificada pela IA como <b>4D — risco grave e iminente</b>.</p>
                 <p>Protocolo: <b>${r.tracking_code}</b><br/>Título: ${r.title}</p>
                 <p><b>Ação imediata:</b> acione o protocolo interno de emergência e valide o caso.</p>`,
        }),
      }).catch(console.error);
    }

    await supabase.from("reports").update({ escalation_sent_at: new Date().toISOString() }).eq("id", report_id);
    return new Response(JSON.stringify({ success: true, emails: emails.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
