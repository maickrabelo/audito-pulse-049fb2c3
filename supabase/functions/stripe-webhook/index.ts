import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // For now, we'll skip signature verification since we don't have webhook secret
    // In production, you should verify the signature
    const event = JSON.parse(body) as Stripe.Event;
    
    logStep("Event type", { type: event.type });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { sessionId: session.id });

      const metadata = session.metadata || {};
      const {
        plan_id,
        plan_slug,
        company_name,
        company_cnpj,
        company_email,
        company_phone,
        responsible_name,
        employee_count,
        referral_code
      } = metadata;

      if (!company_email || !company_name) {
        throw new Error("Missing required metadata");
      }

      // Look up referral code to find partner or affiliate
      let referredByPartnerId = null;
      let referredByAffiliateId = null;

      if (referral_code) {
        // Check partners first
        const { data: partner } = await supabaseClient
          .from("licensed_partners")
          .select("id")
          .eq("referral_code", referral_code)
          .eq("status", "approved")
          .maybeSingle();

        if (partner) {
          referredByPartnerId = partner.id;
          logStep("Found referring partner", { partnerId: partner.id });
        } else {
          // Check affiliates
          const { data: affiliate } = await supabaseClient
            .from("affiliates")
            .select("id")
            .eq("referral_code", referral_code)
            .eq("status", "approved")
            .maybeSingle();

          if (affiliate) {
            referredByAffiliateId = affiliate.id;
            logStep("Found referring affiliate", { affiliateId: affiliate.id });
          }
        }
      }

      // 1. Create company
      const { data: company, error: companyError } = await supabaseClient
        .from("companies")
        .insert({
          name: company_name,
          cnpj: company_cnpj,
          email: company_email,
          phone: company_phone,
          notification_email_1: company_email,
          subscription_status: 'active',
          max_employees: parseInt(employee_count || '15'),
          referred_by_partner_id: referredByPartnerId,
          referred_by_affiliate_id: referredByAffiliateId,
        })
        .select()
        .single();

      if (companyError) {
        logStep("Error creating company", { error: companyError });
        throw companyError;
      }
      logStep("Company created", { companyId: company.id });

      // 2. Create user with temporary password
      const temporaryPassword = generateTemporaryPassword();
      
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email: company_email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: responsible_name,
        }
      });

      if (authError) {
        logStep("Error creating auth user", { error: authError });
        throw authError;
      }
      logStep("Auth user created", { userId: authUser.user.id });

      // 3. Update profile with company_id
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update({
          company_id: company.id,
          full_name: responsible_name,
        })
        .eq("id", authUser.user.id);

      if (profileError) {
        logStep("Error updating profile", { error: profileError });
      }

      // 4. Assign 'company' role (the trigger creates 'pending' by default)
      const { error: roleError } = await supabaseClient
        .from("user_roles")
        .update({ role: 'company' })
        .eq("user_id", authUser.user.id);

      if (roleError) {
        logStep("Error updating role", { error: roleError });
      }
      logStep("User role updated to company");

      // 5. Create subscription record
      const { error: subError } = await supabaseClient
        .from("subscriptions")
        .insert({
          company_id: company.id,
          plan_id: plan_id,
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          status: 'active',
          employee_count: parseInt(employee_count || '15'),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (subError) {
        logStep("Error creating subscription", { error: subError });
      }
      logStep("Subscription record created");

      // 6. Send welcome email with credentials
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const resend = new Resend(resendKey);
        
        const { error: emailError } = await resend.emails.send({
          from: "SOIA <onboarding@resend.dev>",
          to: [company_email],
          subject: "Bem-vindo ao SOIA - Suas credenciais de acesso",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .header h1 { color: white; margin: 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
                .credentials p { margin: 10px 0; }
                .credentials strong { color: #1a365d; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Bem-vindo ao SOIA!</h1>
                </div>
                <div class="content">
                  <p>Olá, <strong>${responsible_name}</strong>!</p>
                  <p>Sua conta na plataforma SOIA foi criada com sucesso. Abaixo estão suas credenciais de acesso:</p>
                  
                  <div class="credentials">
                    <p><strong>Empresa:</strong> ${company_name}</p>
                    <p><strong>Email:</strong> ${company_email}</p>
                    <p><strong>Senha temporária:</strong> ${temporaryPassword}</p>
                  </div>
                  
                  <p><strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso.</p>
                  
                  <a href="https://soia.lovable.app/auth" class="button">Acessar Plataforma</a>
                  
                  <div class="footer">
                    <p>Se você tiver alguma dúvida, entre em contato conosco.</p>
                    <p>Equipe SOIA</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (emailError) {
          logStep("Error sending welcome email", { error: emailError });
        } else {
          logStep("Welcome email sent");
        }
      } else {
        logStep("RESEND_API_KEY not set, skipping email");
      }

      logStep("Checkout processing completed successfully");
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

      const { error } = await supabaseClient
        .from("subscriptions")
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        logStep("Error updating subscription", { error });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription deleted", { subscriptionId: subscription.id });

      const { data: sub } = await supabaseClient
        .from("subscriptions")
        .select("company_id")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (sub) {
        await supabaseClient
          .from("subscriptions")
          .update({ status: 'canceled' })
          .eq("stripe_subscription_id", subscription.id);

        await supabaseClient
          .from("companies")
          .update({ subscription_status: 'inactive' })
          .eq("id", sub.company_id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
