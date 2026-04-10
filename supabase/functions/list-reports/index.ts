import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('CREATE_COMPANY_API_KEY');

    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const companyId = url.searchParams.get('company_id');
    const cnpj = url.searchParams.get('cnpj');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!companyId && !cnpj) {
      return new Response(JSON.stringify({ error: 'company_id ou cnpj é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Se veio cnpj, buscar o company_id primeiro
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId && cnpj) {
      const slug = cnpj.replace(/\D/g, '');
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single();

      if (companyError || !company) {
        return new Response(JSON.stringify({ error: 'Empresa não encontrada com este CNPJ' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      resolvedCompanyId = company.id;
    }

    let query = supabase
      .from('reports')
      .select('id, title, category, status, urgency, department, is_anonymous, tracking_code, created_at, updated_at', { count: 'exact' })
      .eq('company_id', resolvedCompanyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reports, error, count } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      company_id: resolvedCompanyId,
      total: count,
      limit,
      offset,
      reports,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
