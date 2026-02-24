import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportSubmission {
  title: string;
  description: string;
  ai_summary?: string;
  category: string;
  company_id: string;
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  department?: string;
  attachments?: { file_path: string; file_name: string; file_type: string; file_size: number }[];
}

// Input validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const sanitizeInput = (input: string, maxLength: number): string => {
  return input.trim().substring(0, maxLength);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const submission: ReportSubmission = await req.json();

    // Validate required fields
    if (!submission.title || !submission.description || !submission.category || !submission.company_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Campos obrigatórios faltando" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate title length
    if (submission.title.length < 5 || submission.title.length > 200) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "O título deve ter entre 5 e 200 caracteres" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate description length
    if (submission.description.length < 20 || submission.description.length > 5000) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "A descrição deve ter entre 20 e 5000 caracteres" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate email if provided
    if (submission.reporter_email && !validateEmail(submission.reporter_email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email inválido" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate phone if provided
    if (submission.reporter_phone && !validatePhone(submission.reporter_phone)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Telefone inválido" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      title: sanitizeInput(submission.title, 200),
      description: sanitizeInput(submission.description, 5000),
      ai_summary: submission.ai_summary ? sanitizeInput(submission.ai_summary, 1000) : null,
      category: sanitizeInput(submission.category, 50),
      company_id: submission.company_id,
      is_anonymous: submission.is_anonymous,
      reporter_name: submission.reporter_name ? sanitizeInput(submission.reporter_name, 100) : null,
      reporter_email: submission.reporter_email ? sanitizeInput(submission.reporter_email, 255) : null,
      reporter_phone: submission.reporter_phone ? sanitizeInput(submission.reporter_phone, 20) : null,
      department: submission.department ? sanitizeInput(submission.department, 100) : null,
    };

    // Insert report into database
    const { data, error } = await supabase
      .from('reports')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erro ao salvar denúncia" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Insert attachments if provided
    if (submission.attachments && submission.attachments.length > 0) {
      const attachmentsData = submission.attachments.map(att => ({
        report_id: data.id,
        file_path: att.file_path,
        file_name: att.file_name,
        file_type: att.file_type,
        file_size: att.file_size,
      }));

      const { error: attachmentError } = await supabase
        .from('report_attachments')
        .insert(attachmentsData);

      if (attachmentError) {
        console.error('Error saving attachments:', attachmentError);
        // Don't fail the whole request, just log the error
      }
    }

    // Enviar notificação por email (sem aguardar para não bloquear a resposta)
    supabase.functions.invoke('send-notification-email', {
      body: {
        company_id: data.company_id,
        tracking_code: data.tracking_code,
        title: data.title,
        category: data.category,
      }
    }).then(({ error }) => {
      if (error) {
        console.error('Error sending notification email:', error);
      }
    }).catch(err => {
      console.error('Failed to invoke notification function:', err);
    });

    return new Response(
      JSON.stringify({
        success: true,
        tracking_code: data.tracking_code,
        message: "Denúncia enviada com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error submitting report:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Erro ao processar denúncia",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
