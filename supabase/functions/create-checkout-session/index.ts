import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { 
      planSlug, 
      employeeCount, 
      companyName, 
      companyCnpj, 
      companyEmail, 
      companyPhone,
      responsibleName,
      referralCode
    } = await req.json();

    logStep("Request data received", { planSlug, employeeCount, companyName, referralCode });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get plan details from database
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("slug", planSlug)
      .single();

    if (planError || !plan) {
      throw new Error(`Plan not found: ${planSlug}`);
    }
    logStep("Plan found", { planName: plan.name, basePrice: plan.base_price_cents });

    // Calculate total price
    let totalPriceCents = plan.base_price_cents;
    if (plan.price_per_employee_cents && employeeCount > plan.min_employees) {
      const extraEmployees = employeeCount - 100; // Corporate starts at R$299,90 base for 100+
      totalPriceCents += extraEmployees * plan.price_per_employee_cents;
    }
    logStep("Price calculated", { totalPriceCents, employeeCount });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: companyEmail, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      // Create new customer
      const newCustomer = await stripe.customers.create({
        email: companyEmail,
        name: companyName,
        phone: companyPhone,
        metadata: {
          cnpj: companyCnpj,
          responsible_name: responsibleName,
          employee_count: employeeCount.toString(),
          plan_slug: planSlug,
        }
      });
      customerId = newCustomer.id;
      logStep("New customer created", { customerId });
    }

    // Create or get price
    let priceId = plan.stripe_price_id;
    
    if (!priceId || plan.slug === 'corporate') {
      // For corporate plan or if no price exists, create a custom price
      const productName = plan.slug === 'corporate' 
        ? `SOIA Corporate - ${employeeCount} colaboradores`
        : `SOIA ${plan.name}`;

      // Check if product exists
      let productId = plan.stripe_product_id;
      
      if (!productId) {
        const product = await stripe.products.create({
          name: `SOIA ${plan.name}`,
          description: `Plano ${plan.name} - ${plan.min_employees} a ${plan.max_employees || 'ilimitados'} colaboradores`,
        });
        productId = product.id;
        logStep("Product created", { productId });
        
        // Update plan with product ID
        await supabaseClient
          .from("subscription_plans")
          .update({ stripe_product_id: productId })
          .eq("id", plan.id);
      }

      // Create price for this specific configuration
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: totalPriceCents,
        currency: 'brl',
        recurring: { interval: 'month' },
        nickname: plan.slug === 'corporate' ? `${employeeCount} colaboradores` : plan.name,
      });
      priceId = price.id;
      logStep("Price created", { priceId, amount: totalPriceCents });

      // Update plan with default price ID if not corporate
      if (plan.slug !== 'corporate' && !plan.stripe_price_id) {
        await supabaseClient
          .from("subscription_plans")
          .update({ stripe_price_id: priceId })
          .eq("id", plan.id);
      }
    }

    const origin = req.headers.get("origin") || "https://soia.lovable.app";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancelado`,
      metadata: {
        plan_id: plan.id,
        plan_slug: planSlug,
        company_name: companyName,
        company_cnpj: companyCnpj,
        company_email: companyEmail,
        company_phone: companyPhone,
        responsible_name: responsibleName,
        employee_count: employeeCount.toString(),
        referral_code: referralCode || '',
      },
      subscription_data: {
        metadata: {
          plan_id: plan.id,
          plan_slug: planSlug,
          company_name: companyName,
          employee_count: employeeCount.toString(),
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
