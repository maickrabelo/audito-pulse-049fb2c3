import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Autenticação necessária.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Invalid token:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido ou expirado.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role using has_role function
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError) {
      console.error('Error checking role:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao verificar permissões.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.error('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso negado. Apenas administradores podem listar usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all profiles with their data
    const { data: profilesData, error: profilesError } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        full_name,
        company_id,
        sst_manager_id,
        created_at
      `);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar perfis de usuários.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch roles
    const { data: rolesData, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar papéis de usuários.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch auth users for emails using admin API
    const { data: { users: authUsers }, error: authError } = await supabaseClient.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar dados de autenticação.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine data
    const usersWithRoles = (profilesData || []).map(profile => {
      const roleData = rolesData?.find((r: any) => r.user_id === profile.id);
      const authUser = authUsers?.find((u: any) => u.id === profile.id);
      
      return {
        id: profile.id,
        full_name: profile.full_name,
        company_id: profile.company_id,
        sst_manager_id: profile.sst_manager_id,
        created_at: profile.created_at || new Date().toISOString(),
        email: authUser?.email || '',
        role: roleData?.role || 'pending',
      };
    });

    console.log(`Successfully fetched ${usersWithRoles.length} users`);

    return new Response(
      JSON.stringify({ success: true, users: usersWithRoles }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in list-users:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
