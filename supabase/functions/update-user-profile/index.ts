import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the requesting user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if the user has admin role
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('Authorization check failed:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Permissão negada. Apenas administradores podem atualizar perfis.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Parse request body
    const { userId, companyId, sstManagerId } = await req.json();

    // Validate inputs
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (companyId === undefined && sstManagerId === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'Pelo menos um campo (companyId ou sstManagerId) deve ser fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if target user exists
    const { data: targetUser, error: userCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, company_id, sst_manager_id')
      .eq('id', userId)
      .single();

    if (userCheckError || !targetUser) {
      console.error('Target user not found:', userCheckError);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Validate company exists if provided
    if (companyId !== undefined && companyId !== null) {
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        return new Response(
          JSON.stringify({ success: false, error: 'Empresa não encontrada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
    }

    // Validate SST manager exists if provided
    if (sstManagerId !== undefined && sstManagerId !== null) {
      const { data: sstManager, error: sstError } = await supabaseAdmin
        .from('sst_managers')
        .select('id, name')
        .eq('id', sstManagerId)
        .single();

      if (sstError || !sstManager) {
        return new Response(
          JSON.stringify({ success: false, error: 'Gestora SST não encontrada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (companyId !== undefined) {
      updateData.company_id = companyId;
    }
    if (sstManagerId !== undefined) {
      updateData.sst_manager_id = sstManagerId;
    }

    // Update the profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao atualizar perfil do usuário' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const changes = [];
    if (companyId !== undefined) {
      changes.push(`company_id: ${targetUser.company_id} → ${companyId}`);
    }
    if (sstManagerId !== undefined) {
      changes.push(`sst_manager_id: ${targetUser.sst_manager_id} → ${sstManagerId}`);
    }

    console.log(`Admin ${user.email} updated user ${targetUser.full_name} (${userId}) profile: ${changes.join(', ')}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Perfil atualizado com sucesso',
        audit: {
          admin: user.email,
          targetUser: targetUser.full_name,
          changes: changes,
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});