import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartnerContractRequest {
  partner_id: string;
  type: "partner" | "affiliate";
}

interface Representative {
  nome: string;
  cpf: string;
  rg: string;
  is_primary: boolean;
}

const formatCPF = (cpf: string) => {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatCNPJ = (cnpj: string) => {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const generatePartnerContractHTML = (partner: any, representatives: Representative[]) => {
  const primaryRep = representatives.find(r => r.is_primary) || representatives[0];
  const otherReps = representatives.filter(r => r.id !== primaryRep?.id);

  const representativesSection = representatives.map((rep, index) => `
    <p><strong>${index + 1}. ${rep.nome}</strong></p>
    <p>CPF: ${formatCPF(rep.cpf)} | RG: ${rep.rg}</p>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Parceria SOIA</title>
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; color: #333; }
    h1 { text-align: center; color: #1a365d; margin-bottom: 30px; }
    h2 { color: #2c5282; margin-top: 25px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { max-width: 200px; margin-bottom: 20px; }
    .parties { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .clause { margin: 15px 0; text-align: justify; }
    .signature-area { margin-top: 60px; }
    .signature-line { border-top: 1px solid #333; width: 300px; margin: 40px auto 10px; }
    .signature-name { text-align: center; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    .date { text-align: right; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRATO DE PARCERIA COMERCIAL</h1>
    <p>PROGRAMA DE PARCEIROS LICENCIADOS SOIA</p>
  </div>

  <div class="parties">
    <h2>DAS PARTES</h2>
    <p><strong>CONTRATANTE:</strong> SOIA - Sistema de Ouvidoria Inteligente e Automatizado</p>
    <p>Plataforma de gestão de canais de denúncia e pesquisas de clima organizacional.</p>
    
    <p style="margin-top: 20px;"><strong>CONTRATADA (PARCEIRO LICENCIADO):</strong></p>
    <p>Razão Social: <strong>${partner.razao_social}</strong></p>
    <p>Nome Fantasia: <strong>${partner.nome_fantasia}</strong></p>
    <p>CNPJ: <strong>${formatCNPJ(partner.cnpj)}</strong></p>
    <p>Endereço: ${partner.endereco_completo}</p>
    <p>E-mail: ${partner.email}</p>
    ${partner.phone ? `<p>Telefone: ${partner.phone}</p>` : ""}
    
    <p style="margin-top: 15px;"><strong>Representantes Legais:</strong></p>
    ${representativesSection}
  </div>

  <h2>CLÁUSULA 1ª - DO OBJETO</h2>
  <p class="clause">O presente contrato tem por objeto estabelecer os termos e condições para a parceria comercial entre as partes, autorizando o PARCEIRO LICENCIADO a promover, comercializar e indicar os serviços da plataforma SOIA a potenciais clientes empresariais.</p>

  <h2>CLÁUSULA 2ª - DAS OBRIGAÇÕES DO PARCEIRO</h2>
  <p class="clause">2.1. Prospectar ativamente empresas interessadas nos serviços SOIA;</p>
  <p class="clause">2.2. Apresentar corretamente os serviços e funcionalidades da plataforma;</p>
  <p class="clause">2.3. Manter sigilo sobre informações confidenciais obtidas durante a parceria;</p>
  <p class="clause">2.4. Utilizar exclusivamente os materiais de marketing fornecidos pela SOIA;</p>
  <p class="clause">2.5. Não fazer promessas ou garantias além das especificadas pela SOIA.</p>

  <h2>CLÁUSULA 3ª - DA REMUNERAÇÃO</h2>
  <p class="clause">3.1. O PARCEIRO fará jus a uma comissão de 25% (vinte e cinco por cento) sobre o valor mensal pago pelas empresas que contratarem os serviços SOIA através de sua indicação;</p>
  <p class="clause">3.2. A comissão será devida enquanto a empresa indicada mantiver contrato ativo com a SOIA;</p>
  <p class="clause">3.3. O pagamento será realizado mensalmente, até o dia 15 do mês subsequente;</p>
  <p class="clause">3.4. Para fazer jus à comissão, a empresa deve ter sido cadastrada através do link de indicação exclusivo do PARCEIRO.</p>

  <h2>CLÁUSULA 4ª - DA VIGÊNCIA</h2>
  <p class="clause">4.1. Este contrato terá vigência de 12 (doze) meses, renovando-se automaticamente por igual período;</p>
  <p class="clause">4.2. Qualquer das partes poderá rescindir o contrato mediante aviso prévio de 30 (trinta) dias.</p>

  <h2>CLÁUSULA 5ª - DA RESCISÃO</h2>
  <p class="clause">5.1. O contrato poderá ser rescindido imediatamente em caso de:</p>
  <p class="clause">a) Descumprimento de qualquer cláusula contratual;</p>
  <p class="clause">b) Prática de atos que prejudiquem a imagem da SOIA;</p>
  <p class="clause">c) Falência, recuperação judicial ou dissolução de qualquer das partes.</p>

  <h2>CLÁUSULA 6ª - DISPOSIÇÕES GERAIS</h2>
  <p class="clause">6.1. Este contrato não estabelece vínculo empregatício entre as partes;</p>
  <p class="clause">6.2. O PARCEIRO não poderá ceder ou transferir os direitos deste contrato;</p>
  <p class="clause">6.3. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer questões.</p>

  <div class="date">
    <p>${formatDate(new Date())}</p>
  </div>

  <div class="signature-area">
    <div class="signature-line"></div>
    <p class="signature-name"><strong>SOIA</strong></p>
    <p class="signature-name">Contratante</p>

    <div class="signature-line"></div>
    <p class="signature-name"><strong>${partner.razao_social}</strong></p>
    <p class="signature-name">${primaryRep?.nome || "Representante Legal"}</p>
    <p class="signature-name">Contratada</p>
  </div>

  <div class="footer">
    <p>Contrato gerado eletronicamente em ${formatDate(new Date())}</p>
    <p>Código de referência: ${partner.referral_code}</p>
  </div>
</body>
</html>
  `;
};

const generateAffiliateContractHTML = (affiliate: any) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Afiliação SOIA</title>
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; color: #333; }
    h1 { text-align: center; color: #1a365d; margin-bottom: 30px; }
    h2 { color: #2c5282; margin-top: 25px; }
    .header { text-align: center; margin-bottom: 40px; }
    .parties { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .clause { margin: 15px 0; text-align: justify; }
    .signature-area { margin-top: 60px; }
    .signature-line { border-top: 1px solid #333; width: 300px; margin: 40px auto 10px; }
    .signature-name { text-align: center; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    .date { text-align: right; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRATO DE AFILIAÇÃO</h1>
    <p>PROGRAMA DE AFILIADOS SOIA</p>
  </div>

  <div class="parties">
    <h2>DAS PARTES</h2>
    <p><strong>CONTRATANTE:</strong> SOIA - Sistema de Ouvidoria Inteligente e Automatizado</p>
    <p>Plataforma de gestão de canais de denúncia e pesquisas de clima organizacional.</p>
    
    <p style="margin-top: 20px;"><strong>AFILIADO:</strong></p>
    <p>Nome: <strong>${affiliate.nome_completo}</strong></p>
    <p>CPF: <strong>${formatCPF(affiliate.cpf)}</strong></p>
    <p>RG: <strong>${affiliate.rg}</strong></p>
    <p>Estado Civil: ${affiliate.estado_civil}</p>
    <p>Profissão: ${affiliate.profissao}</p>
    <p>Endereço: ${affiliate.endereco_completo}</p>
    <p>E-mail: ${affiliate.email}</p>
    ${affiliate.phone ? `<p>Telefone: ${affiliate.phone}</p>` : ""}
  </div>

  <h2>CLÁUSULA 1ª - DO OBJETO</h2>
  <p class="clause">O presente contrato tem por objeto estabelecer os termos e condições para a afiliação, autorizando o AFILIADO a promover e indicar os serviços da plataforma SOIA a potenciais clientes empresariais.</p>

  <h2>CLÁUSULA 2ª - DAS OBRIGAÇÕES DO AFILIADO</h2>
  <p class="clause">2.1. Divulgar e indicar os serviços SOIA de forma ética e responsável;</p>
  <p class="clause">2.2. Manter sigilo sobre informações confidenciais obtidas durante a afiliação;</p>
  <p class="clause">2.3. Utilizar exclusivamente os materiais de marketing fornecidos pela SOIA;</p>
  <p class="clause">2.4. Não fazer promessas ou garantias além das especificadas pela SOIA.</p>

  <h2>CLÁUSULA 3ª - DA REMUNERAÇÃO</h2>
  <p class="clause">3.1. O AFILIADO fará jus a uma comissão de 25% (vinte e cinco por cento) sobre o valor mensal pago pelas empresas que contratarem os serviços SOIA através de sua indicação;</p>
  <p class="clause">3.2. A comissão será devida enquanto a empresa indicada mantiver contrato ativo com a SOIA;</p>
  <p class="clause">3.3. O pagamento será realizado mensalmente, até o dia 15 do mês subsequente.</p>

  <h2>CLÁUSULA 4ª - DA VIGÊNCIA</h2>
  <p class="clause">4.1. Este contrato terá vigência de 12 (doze) meses, renovando-se automaticamente;</p>
  <p class="clause">4.2. Qualquer das partes poderá rescindir mediante aviso prévio de 30 dias.</p>

  <h2>CLÁUSULA 5ª - DISPOSIÇÕES GERAIS</h2>
  <p class="clause">5.1. Este contrato não estabelece vínculo empregatício;</p>
  <p class="clause">5.2. Fica eleito o foro da comarca de São Paulo/SP para dirimir questões.</p>

  <div class="date">
    <p>${formatDate(new Date())}</p>
  </div>

  <div class="signature-area">
    <div class="signature-line"></div>
    <p class="signature-name"><strong>SOIA</strong></p>
    <p class="signature-name">Contratante</p>

    <div class="signature-line"></div>
    <p class="signature-name"><strong>${affiliate.nome_completo}</strong></p>
    <p class="signature-name">Afiliado</p>
  </div>

  <div class="footer">
    <p>Contrato gerado eletronicamente em ${formatDate(new Date())}</p>
    <p>Código de referência: ${affiliate.referral_code}</p>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    // Accept both partnerId and partner_id for compatibility
    const partner_id = body.partner_id || body.partnerId;
    const type = body.type || "partner";

    console.log(`Generating contract for ${type}: ${partner_id}`);

    let contractHTML: string;
    let fileName: string;

    if (type === "partner") {
      // Fetch partner data
      const { data: partner, error: partnerError } = await supabase
        .from("licensed_partners")
        .select("*")
        .eq("id", partner_id)
        .single();

      if (partnerError || !partner) {
        console.error("Partner not found:", partnerError);
        throw new Error("Parceiro não encontrado");
      }

      // Fetch representatives
      const { data: representatives, error: repError } = await supabase
        .from("partner_representatives")
        .select("*")
        .eq("partner_id", partner_id);

      if (repError) {
        console.error("Error fetching representatives:", repError);
        throw new Error("Erro ao buscar representantes");
      }

      contractHTML = generatePartnerContractHTML(partner, representatives || []);
      fileName = `contrato-parceiro-${partner.cnpj.replace(/\D/g, "")}-${Date.now()}.html`;

      // Update partner with contract info
      await supabase
        .from("licensed_partners")
        .update({
          contract_url: fileName,
          status: "pending_contract",
        })
        .eq("id", partner_id);

    } else {
      // Fetch affiliate data
      const { data: affiliate, error: affiliateError } = await supabase
        .from("affiliates")
        .select("*")
        .eq("id", partner_id)
        .single();

      if (affiliateError || !affiliate) {
        console.error("Affiliate not found:", affiliateError);
        throw new Error("Afiliado não encontrado");
      }

      contractHTML = generateAffiliateContractHTML(affiliate);
      fileName = `contrato-afiliado-${affiliate.cpf.replace(/\D/g, "")}-${Date.now()}.html`;

      // Update affiliate with contract info
      await supabase
        .from("affiliates")
        .update({
          contract_url: fileName,
          status: "pending_contract",
        })
        .eq("id", partner_id);
    }

    console.log(`Contract generated successfully: ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        contract_html: contractHTML,
        file_name: fileName,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating contract:", error);
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
