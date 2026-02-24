import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovePartnerRequest {
  partnerId?: string;
  partner_id?: string;
  type: "partner" | "affiliate";
  action: "approve" | "reject";
  reason?: string;
  rejection_reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Token inválido");
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Acesso negado. Apenas administradores podem aprovar parceiros.");
    }

    const body: ApprovePartnerRequest = await req.json();
    const partner_id = body.partnerId || body.partner_id;
    const rejection_reason = body.reason || body.rejection_reason;
    const { type, action } = body;

    if (!partner_id) {
      throw new Error("ID do parceiro/afiliado é obrigatório");
    }

    console.log(`Processing ${action} for ${type}: ${partner_id}`);

    const tableName = type === "partner" ? "licensed_partners" : "affiliates";

    // Fetch partner/affiliate data
    const { data: partnerData, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", partner_id)
      .single();

    if (fetchError || !partnerData) {
      throw new Error(`${type === "partner" ? "Parceiro" : "Afiliado"} não encontrado`);
    }

    if (action === "reject") {
      // Update status to rejected
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          status: "rejected",
          rejection_reason: rejection_reason || "Cadastro não aprovado pela administração",
        })
        .eq("id", partner_id);

      if (updateError) {
        throw new Error("Erro ao atualizar status");
      }

      // Send rejection email
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-partner-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          email: partnerData.email,
          name: type === "partner" ? partnerData.razao_social : partnerData.nome_completo,
          type: type,
          email_type: "rejected",
          rejection_reason: rejection_reason,
        }),
      });

      console.log("Rejection email sent:", await emailResponse.json());

      return new Response(
        JSON.stringify({ success: true, message: "Cadastro rejeitado com sucesso" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // APPROVAL FLOW
    const loginIdentifier = type === "partner" 
      ? partnerData.cnpj.replace(/\D/g, "") 
      : partnerData.cpf.replace(/\D/g, "");
    
    const email = partnerData.email;
    const initialPassword = loginIdentifier; // CNPJ or CPF as initial password

    // Check if user already exists with this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    let newUserId: string;

    if (existingUser) {
      console.log(`User with email ${email} already exists, linking to existing user: ${existingUser.id}`);
      newUserId = existingUser.id;
      
      // Update user metadata
      await supabase.auth.admin.updateUserById(newUserId, {
        user_metadata: {
          full_name: type === "partner" ? partnerData.razao_social : partnerData.nome_completo,
          partner_type: type,
          partner_id: partner_id,
        },
      });
    } else {
      // Create new auth user
      const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
        email: email,
        password: initialPassword,
        email_confirm: true,
        user_metadata: {
          full_name: type === "partner" ? partnerData.razao_social : partnerData.nome_completo,
          partner_type: type,
          partner_id: partner_id,
        },
      });

      if (createUserError) {
        console.error("Error creating user:", createUserError);
        throw new Error(`Erro ao criar usuário: ${createUserError.message}`);
      }

      newUserId = authData.user.id;
    }
    console.log(`Created auth user: ${newUserId}`);

    // Check if role already exists, if not assign it
    const roleName = type === "partner" ? "partner" : "affiliate";
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", newUserId)
      .eq("role", roleName)
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: newUserId,
          role: roleName,
        });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        // Only rollback if we created a new user
        if (!existingUser) {
          await supabase.auth.admin.deleteUser(newUserId);
        }
        throw new Error("Erro ao atribuir role");
      }
    } else {
      console.log(`Role ${roleName} already exists for user ${newUserId}`);
    }

    // Update partner/affiliate with user_id and approved status
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        user_id: newUserId,
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        first_access_completed: false,
      })
      .eq("id", partner_id);

    if (updateError) {
      console.error("Error updating partner:", updateError);
      // Rollback
      await supabase.from("user_roles").delete().eq("user_id", newUserId);
      await supabase.auth.admin.deleteUser(newUserId);
      throw new Error("Erro ao atualizar dados do parceiro");
    }

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: newUserId,
        full_name: type === "partner" ? partnerData.razao_social : partnerData.nome_completo,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Continue anyway, profile creation is not critical
    }

    // Send approval email with credentials
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-partner-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        email: partnerData.email,
        name: type === "partner" ? partnerData.razao_social : partnerData.nome_completo,
        type: type,
        email_type: "approved",
        login_credentials: {
          login: email,
          password: loginIdentifier,
        },
      }),
    });

    console.log("Approval email sent:", await emailResponse.json());

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cadastro aprovado com sucesso",
        user_id: newUserId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in approve-partner:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
