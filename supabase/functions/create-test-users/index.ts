import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the user is authenticated and is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Admin access required' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const results = { partner: null as any, affiliate: null as any };

    // ========== CREATE TEST PARTNER ==========
    const partnerEmail = 'parceiro.teste@soia.app';
    const partnerPassword = 'Teste123!';

    // Check if partner user already exists
    const { data: existingPartnerUsers } = await supabaseAdmin.auth.admin.listUsers();
    let partnerUser = existingPartnerUsers?.users.find(u => u.email === partnerEmail);

    if (!partnerUser) {
      const { data: newPartnerAuth, error: partnerAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: partnerEmail,
        password: partnerPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Parceiro Teste SOIA' },
      });

      if (partnerAuthError) throw new Error(`Partner auth error: ${partnerAuthError.message}`);
      partnerUser = newPartnerAuth.user;
    } else {
      // Update password if user exists
      await supabaseAdmin.auth.admin.updateUserById(partnerUser.id, {
        password: partnerPassword,
        email_confirm: true,
      });
    }

    // Check if partner record exists
    const { data: existingPartner } = await supabaseAdmin
      .from('licensed_partners')
      .select('id')
      .eq('email', partnerEmail)
      .maybeSingle();

    if (!existingPartner) {
      const { error: partnerInsertError } = await supabaseAdmin
        .from('licensed_partners')
        .insert({
          user_id: partnerUser!.id,
          razao_social: 'Empresa Parceira Teste LTDA',
          nome_fantasia: 'Parceiro Teste SOIA',
          cnpj: '12.345.678/0001-90',
          endereco_completo: 'Rua dos Testes, 123 - Centro, São Paulo/SP - CEP 01234-567',
          email: partnerEmail,
          phone: '(11) 99999-0001',
          status: 'approved',
          contract_signed: true,
          contract_signed_at: new Date().toISOString(),
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });

      if (partnerInsertError) throw new Error(`Partner insert error: ${partnerInsertError.message}`);
    } else {
      // Update existing partner with user_id and approved status
      await supabaseAdmin
        .from('licensed_partners')
        .update({
          user_id: partnerUser!.id,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('email', partnerEmail);
    }

    // Ensure partner role exists
    const { data: existingPartnerRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', partnerUser!.id)
      .maybeSingle();

    if (!existingPartnerRole) {
      await supabaseAdmin.from('user_roles').insert({ user_id: partnerUser!.id, role: 'partner' });
    } else {
      await supabaseAdmin.from('user_roles').update({ role: 'partner' }).eq('user_id', partnerUser!.id);
    }

    // Ensure partner profile exists
    const { data: existingPartnerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', partnerUser!.id)
      .maybeSingle();

    if (!existingPartnerProfile) {
      await supabaseAdmin.from('profiles').insert({ id: partnerUser!.id, full_name: 'Parceiro Teste SOIA' });
    }

    results.partner = { email: partnerEmail, password: partnerPassword, created: !existingPartner };

    // ========== CREATE TEST AFFILIATE ==========
    const affiliateEmail = 'afiliado.teste@soia.app';
    const affiliatePassword = 'Teste123!';

    let affiliateUser = existingPartnerUsers?.users.find(u => u.email === affiliateEmail);

    if (!affiliateUser) {
      const { data: newAffiliateAuth, error: affiliateAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: affiliateEmail,
        password: affiliatePassword,
        email_confirm: true,
        user_metadata: { full_name: 'Afiliado Teste SOIA' },
      });

      if (affiliateAuthError) throw new Error(`Affiliate auth error: ${affiliateAuthError.message}`);
      affiliateUser = newAffiliateAuth.user;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(affiliateUser.id, {
        password: affiliatePassword,
        email_confirm: true,
      });
    }

    // Check if affiliate record exists
    const { data: existingAffiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('email', affiliateEmail)
      .maybeSingle();

    if (!existingAffiliate) {
      const { error: affiliateInsertError } = await supabaseAdmin
        .from('affiliates')
        .insert({
          user_id: affiliateUser!.id,
          nome_completo: 'Afiliado Teste da Silva',
          cpf: '123.456.789-00',
          rg: '12.345.678-9',
          estado_civil: 'Solteiro(a)',
          profissao: 'Consultor de Segurança do Trabalho',
          endereco_completo: 'Av. dos Afiliados, 456 - Jardins, São Paulo/SP - CEP 04567-890',
          email: affiliateEmail,
          phone: '(11) 99999-0002',
          status: 'approved',
          contract_signed: true,
          contract_signed_at: new Date().toISOString(),
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });

      if (affiliateInsertError) throw new Error(`Affiliate insert error: ${affiliateInsertError.message}`);
    } else {
      await supabaseAdmin
        .from('affiliates')
        .update({
          user_id: affiliateUser!.id,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('email', affiliateEmail);
    }

    // Ensure affiliate role exists
    const { data: existingAffiliateRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', affiliateUser!.id)
      .maybeSingle();

    if (!existingAffiliateRole) {
      await supabaseAdmin.from('user_roles').insert({ user_id: affiliateUser!.id, role: 'affiliate' });
    } else {
      await supabaseAdmin.from('user_roles').update({ role: 'affiliate' }).eq('user_id', affiliateUser!.id);
    }

    // Ensure affiliate profile exists
    const { data: existingAffiliateProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', affiliateUser!.id)
      .maybeSingle();

    if (!existingAffiliateProfile) {
      await supabaseAdmin.from('profiles').insert({ id: affiliateUser!.id, full_name: 'Afiliado Teste SOIA' });
    }

    results.affiliate = { email: affiliateEmail, password: affiliatePassword, created: !existingAffiliate };

    console.log('Test users created successfully:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error creating test users:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
