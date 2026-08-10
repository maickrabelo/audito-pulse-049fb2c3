import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Marca prazos vencidos e envia alerta único por prazo.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const agora = new Date().toISOString();

  const { data: vencidos, error } = await supabase
    .from("sla_prazos")
    .select("id, report_id, evento, limite_em, alerta_enviado_em, reports(tracking_code, company_id)")
    .is("concluido_em", null)
    .is("pausado_em", null)
    .lt("limite_em", agora)
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ids = (vencidos || []).map((v: { id: string }) => v.id);
  if (ids.length) await supabase.from("sla_prazos").update({ em_atraso: true }).in("id", ids);

  const paraAlertar = (vencidos || []).filter((v: { alerta_enviado_em: string | null }) => !v.alerta_enviado_em);
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  for (const v of paraAlertar) {
    const rep = (v as { reports?: { tracking_code?: string; company_id?: string } }).reports;
    if (RESEND_API_KEY && rep?.company_id) {
      const { data: c } = await supabase
        .from("companies")
        .select("name, notification_email_1, notification_email_2, notification_email_3")
        .eq("id", rep.company_id).maybeSingle();
      const emails = [c?.notification_email_1, c?.notification_email_2, c?.notification_email_3].filter(Boolean);
      if (emails.length) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Ouvidoria AMO <alertas@grupoamo.com.br>",
            to: emails,
            subject: `Prazo vencido — manifestação ${rep?.tracking_code ?? ""}`,
            html: `<p>O prazo <b>${(v as { evento: string }).evento}</b> da manifestação <b>${rep?.tracking_code ?? ""}</b> está vencido desde ${new Date((v as { limite_em: string }).limite_em).toLocaleString("pt-BR")}.</p>`,
          }),
        }).catch(console.error);
      }
    }
    await supabase.from("sla_prazos").update({ alerta_enviado_em: agora }).eq("id", (v as { id: string }).id);
  }

  return new Response(JSON.stringify({ success: true, vencidos: ids.length, alertados: paraAlertar.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
