import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartnerEmailRequest {
  email: string;
  name: string;
  type: "partner" | "affiliate";
  email_type: "contract_generated" | "registration_pending" | "approved" | "rejected";
  contract_html?: string;
  rejection_reason?: string;
  login_credentials?: {
    login: string;
    password: string;
  };
}

const getEmailSubject = (email_type: string, type: string): string => {
  const typeLabel = type === "partner" ? "Parceiro" : "Afiliado";
  
  switch (email_type) {
    case "contract_generated":
      return `SOIA - Seu Contrato de ${typeLabel} está pronto`;
    case "registration_pending":
      return `SOIA - Cadastro de ${typeLabel} em Análise`;
    case "approved":
      return `SOIA - Parabéns! Seu cadastro de ${typeLabel} foi aprovado!`;
    case "rejected":
      return `SOIA - Atualização sobre seu cadastro de ${typeLabel}`;
    default:
      return `SOIA - Notificação`;
  }
};

const getEmailHTML = (request: PartnerEmailRequest): string => {
  const { name, type, email_type, rejection_reason, login_credentials } = request;
  const typeLabel = type === "partner" ? "Parceiro Licenciado" : "Afiliado";

  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a365d, #2c5282); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; background: #2c5282; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .credentials { background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      .highlight { color: #2c5282; font-weight: bold; }
    </style>
  `;

  switch (email_type) {
    case "contract_generated":
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Contrato Gerado</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Seu contrato de <span class="highlight">${typeLabel}</span> SOIA foi gerado com sucesso!</p>
              <p>O contrato está anexado a este email em formato HTML. Por favor:</p>
              <ol>
                <li>Leia atentamente todas as cláusulas</li>
                <li>Acesse nosso portal para assinar digitalmente</li>
                <li>Aguarde a aprovação do nosso time</li>
              </ol>
              <p>Estamos ansiosos para tê-lo como parceiro!</p>
            </div>
            <div class="footer">
              <p>SOIA - Sistema de Ouvidoria Inteligente e Automatizado</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case "registration_pending":
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cadastro em Análise</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Recebemos seu cadastro como <span class="highlight">${typeLabel}</span> e seu contrato assinado!</p>
              <p>Nossa equipe está analisando sua solicitação. Você receberá um email assim que seu cadastro for aprovado.</p>
              <p>O prazo médio de análise é de <strong>até 3 dias úteis</strong>.</p>
              <p>Qualquer dúvida, entre em contato conosco.</p>
            </div>
            <div class="footer">
              <p>SOIA - Sistema de Ouvidoria Inteligente e Automatizado</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case "approved":
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Cadastro Aprovado!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Temos uma ótima notícia! Seu cadastro como <span class="highlight">${typeLabel}</span> foi <strong>APROVADO</strong>!</p>
              <p>Agora você faz parte do nosso programa de parceiros e pode começar a indicar empresas.</p>
              
              ${login_credentials ? `
              <div class="credentials">
                <h3>Seus dados de acesso:</h3>
                <p><strong>Login:</strong> ${login_credentials.login}</p>
                <p><strong>Senha inicial:</strong> ${login_credentials.password}</p>
                <p style="color: #c53030; font-size: 14px;">⚠️ Por segurança, você deverá alterar sua senha no primeiro acesso.</p>
              </div>
              ` : ""}
              
              <p>Na sua área de parceiro você poderá:</p>
              <ul>
                <li>Acompanhar suas indicações</li>
                <li>Ver suas comissões estimadas</li>
                <li>Gerenciar seu CRM de prospecção</li>
                <li>Obter seu link de indicação exclusivo</li>
              </ul>
              
              <p>Bem-vindo à família SOIA!</p>
            </div>
            <div class="footer">
              <p>SOIA - Sistema de Ouvidoria Inteligente e Automatizado</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case "rejected":
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #742a2a, #9b2c2c);">
              <h1>Cadastro não aprovado</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Infelizmente, após análise, não foi possível aprovar seu cadastro como <span class="highlight">${typeLabel}</span> neste momento.</p>
              
              ${rejection_reason ? `
              <div class="credentials" style="background: #fff5f5; border-left: 4px solid #c53030;">
                <h3>Motivo:</h3>
                <p>${rejection_reason}</p>
              </div>
              ` : ""}
              
              <p>Se você acredita que houve algum equívoco ou deseja mais informações, entre em contato conosco.</p>
              <p>Você pode tentar um novo cadastro após resolver as pendências indicadas.</p>
            </div>
            <div class="footer">
              <p>SOIA - Sistema de Ouvidoria Inteligente e Automatizado</p>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Notificação SOIA</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Esta é uma notificação do sistema SOIA.</p>
            </div>
          </div>
        </body>
        </html>
      `;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: PartnerEmailRequest = await req.json();
    const { email, name, type, email_type, contract_html } = request;

    console.log(`Sending ${email_type} email to ${email} (${type})`);

    const subject = getEmailSubject(email_type, type);
    const html = getEmailHTML(request);

    const emailOptions: any = {
      from: "SOIA <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: html,
    };

    // Attach contract if provided
    if (contract_html && email_type === "contract_generated") {
      emailOptions.attachments = [
        {
          filename: `contrato-${type}-soia.html`,
          content: Buffer.from(contract_html).toString("base64"),
          type: "text/html",
        },
      ];
    }

    const emailResponse = await resend.emails.send(emailOptions);

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
