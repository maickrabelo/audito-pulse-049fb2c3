import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { LEGAL_DOCUMENTS } from '../_shared/legal-documents.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ error: 'Não autenticado' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) return json({ error: 'Sessão inválida' }, 401);

    const body = await req.json().catch(() => ({}));
    const documentCode = String(body?.document_code ?? '');
    const result = String(body?.result ?? '');
    const declarations = Array.isArray(body?.declarations) ? body.declarations : [];
    const reason = body?.reason ? String(body.reason).slice(0, 500) : null;

    if (!['accepted', 'refused'].includes(result)) {
      return json({ error: 'Resultado inválido' }, 400);
    }

    const doc = LEGAL_DOCUMENTS.find((d) => d.code === documentCode);
    if (!doc) return json({ error: 'Documento não encontrado' }, 400);

    if (result === 'accepted') {
      const allChecked =
        declarations.length === doc.declarations.length &&
        declarations.every((d: { checked?: boolean }) => d?.checked === true);
      if (!allChecked) return json({ error: 'Todas as declarações devem ser confirmadas' }, 400);
    }

    // Garante que a versão exata do documento está registrada (imutável por versão)
    const { data: existingDoc } = await admin
      .from('legal_documents')
      .select('id')
      .eq('code', doc.code)
      .eq('version', doc.version)
      .maybeSingle();

    let documentId = existingDoc?.id as string | undefined;
    if (!documentId) {
      await admin
        .from('legal_documents')
        .update({ is_active: false })
        .eq('code', doc.code)
        .eq('is_active', true);

      const { data: inserted, error: insertDocError } = await admin
        .from('legal_documents')
        .insert({
          code: doc.code,
          version: doc.version,
          title: doc.title,
          subtitle: doc.subtitle,
          effective_date: doc.effective_date,
          content: doc.content,
          content_hash: doc.content_hash,
          summary: doc.summary ? doc.summary.join('\n') : null,
          declarations: doc.declarations,
          audience: doc.audience,
          is_active: true,
        })
        .select('id')
        .single();
      if (insertDocError) return json({ error: insertDocError.message }, 500);
      documentId = inserted.id;
    }

    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      admin.from('profiles').select('full_name, company_id, sst_manager_id').eq('id', user.id).maybeSingle(),
      admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
    ]);

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('cf-connecting-ip') ??
      null;

    const { error: acceptError } = await admin.from('legal_acceptances').insert({
      user_id: user.id,
      user_email: user.email ?? null,
      user_name: profile?.full_name ?? null,
      company_id: profile?.company_id ?? null,
      sst_manager_id: profile?.sst_manager_id ?? null,
      role: roleRow?.role ?? null,
      permissions: { role: roleRow?.role ?? null, company_id: profile?.company_id ?? null },
      document_id: documentId,
      document_code: doc.code,
      document_version: doc.version,
      document_title: doc.title,
      document_effective_date: doc.effective_date,
      document_hash: doc.content_hash,
      declarations,
      result,
      reason,
      ip,
      user_agent: req.headers.get('user-agent'),
      session_id: body?.session_id ? String(body.session_id).slice(0, 120) : null,
      timezone: body?.timezone ? String(body.timezone).slice(0, 80) : null,
    });

    if (acceptError) return json({ error: acceptError.message }, 500);

    return json({ success: true, document_version: doc.version, document_hash: doc.content_hash });
  } catch (err) {
    console.error('record-legal-acceptance error', err);
    return json({ error: 'Erro interno' }, 500);
  }
});
