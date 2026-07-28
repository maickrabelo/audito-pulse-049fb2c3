import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ShieldCheck, Loader2, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ReportChat, type ReportMetadata } from '@/components/ReportChatContent';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface Props { companyId: string; companyName: string; }

type Snapshot = { unidade?: string | null; setor?: string | null; ghe?: string | null; cargo?: string | null; cbo?: string | null };

const ReportWizard: React.FC<Props> = ({ companyId, companyName }) => {
  const [step, setStep] = useState<'aviso' | 'cpf' | 'confirm' | 'dados' | 'chat'>('aviso');
  const [meta, setMeta] = useState<ReportMetadata>({
    ha_risco_imediato_informado: false,
    autorizacao_para_contato: false,
    aceite_politica_privacidade: false,
    declaracao_de_boa_fe: false,
  });
  const setM = (patch: Partial<ReportMetadata>) => setMeta(prev => ({ ...prev, ...patch }));
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const formatCpf = (v: string) => v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  const validateCpf = async () => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return;
    setLoading(true); setNotFound(false);
    const { data, error } = await supabase.functions.invoke('validate-cpf-link', {
      body: { company_id: companyId, cpf: digits },
    });
    setLoading(false);
    if (error || !data) return;
    if (!data.found) { setNotFound(true); return; }
    setSnapshot(data.snapshot);
    setStep('confirm');
  };

  if (step === 'aviso') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Antes de começar</CardTitle>
          <CardDescription>Leia com atenção este canal de ouvidoria.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Escopo do canal (NR-1 / SST)</AlertTitle>
            <AlertDescription>
              Este canal é destinado a relatos de <b>Segurança e Saúde no Trabalho</b>: assédio moral ou sexual,
              sobrecarga, discriminação, violência, riscos psicossociais e condições inseguras.
              Assuntos fora deste escopo (problemas pessoais, familiares, questões cíveis com terceiros) devem ser
              tratados em outros canais adequados.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Emergência — risco grave e iminente</AlertTitle>
            <AlertDescription>
              Se há risco imediato à vida (tentativa de suicídio, agressão em curso, ferimento grave),
              acione agora: <b>SAMU 192</b>, <b>Bombeiros 193</b>, <b>Polícia 190</b> ou <b>CVV 188</b>.
              Este canal <b>não substitui atendimento emergencial</b>.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setStep('cpf')}>Entendi, continuar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'cpf') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identificação do vínculo</CardTitle>
          <CardDescription>
            Informe seu CPF para validarmos o vínculo com <b>{companyName}</b>.
            Seu CPF <b>não fica armazenado</b> — usamos apenas para localizar seu setor/cargo e reforçar
            que sua denúncia é procedente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" />
          </div>
          {notFound && (
            <Alert variant="destructive">
              <AlertDescription>
                CPF não localizado no cadastro desta empresa. Verifique os dígitos ou prossiga de forma anônima
                (a denúncia passará por triagem adicional).
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <Button variant="ghost" onClick={() => { setAnonymous(true); setStep('dados'); }}>
              Prefiro relatar de forma anônima
            </Button>
            <Button onClick={validateCpf} disabled={loading || cpf.replace(/\D/g, '').length !== 11}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Validar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'confirm' && snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirmação do vínculo</CardTitle>
          <CardDescription>Encontramos o seguinte cadastro. Confirme se corresponde ao seu vínculo:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 p-4 rounded-md">
            <div><span className="text-muted-foreground">Unidade:</span> <b>{snapshot.unidade || '—'}</b></div>
            <div><span className="text-muted-foreground">Setor:</span> <b>{snapshot.setor || '—'}</b></div>
            <div><span className="text-muted-foreground">Cargo:</span> <b>{snapshot.cargo || '—'}</b></div>
            <div><span className="text-muted-foreground">CBO:</span> <b>{snapshot.cbo || '—'}</b></div>
            {snapshot.ghe && <div className="col-span-2"><span className="text-muted-foreground">GHE:</span> <b>{snapshot.ghe}</b></div>}
          </div>
          <p className="text-xs text-muted-foreground">
            Ao seguir, seu relato é registrado com esse contexto (sem CPF). A denúncia continua sendo tratada
            de forma confidencial.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setStep('cpf'); setSnapshot(null); }}>Voltar</Button>
            <Button onClick={() => setStep('dados')}>Confirmar e continuar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'dados') {
    const podeSeguir = !!meta.periodo_descritivo?.trim() && !!meta.local_ocorrencia?.trim()
      && meta.aceite_politica_privacidade && meta.declaracao_de_boa_fe;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados mínimos do relato</CardTitle>
          <CardDescription>
            Estas informações permitem a triagem técnica. Descreva pessoas pelo <b>papel funcional</b>
            {' '}(ex.: "meu supervisor"), sem nomes ou dados pessoais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodo">Período da ocorrência *</Label>
              <Input id="periodo" placeholder="Ex.: nos últimos 3 meses"
                value={meta.periodo_descritivo || ''} onChange={e => setM({ periodo_descritivo: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="local">Local ou setor *</Label>
              <Input id="local" placeholder="Ex.: linha de produção, turno da noite"
                value={meta.local_ocorrencia || ''} onChange={e => setM({ local_ocorrencia: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ini">Data de início (opcional)</Label>
              <Input id="ini" type="date" value={meta.data_inicio_ocorrencia || ''}
                onChange={e => setM({ data_inicio_ocorrencia: e.target.value || null })} />
            </div>
            <div>
              <Label htmlFor="fim">Data de término (opcional)</Label>
              <Input id="fim" type="date" value={meta.data_fim_ocorrencia || ''}
                onChange={e => setM({ data_fim_ocorrencia: e.target.value || null })} />
            </div>
          </div>
          <div>
            <Label htmlFor="env">Pessoas envolvidas (papel funcional)</Label>
            <Textarea id="env" rows={2} placeholder="Ex.: o encarregado do meu setor e dois colegas da equipe"
              value={meta.pessoas_envolvidas || ''} onChange={e => setM({ pessoas_envolvidas: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="test">Há testemunhas? (papel funcional)</Label>
            <Textarea id="test" rows={2} value={meta.testemunhas || ''} onChange={e => setM({ testemunhas: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="evid">Evidências disponíveis</Label>
            <Textarea id="evid" rows={2} placeholder="Ex.: escala de trabalho, mensagens, registros de ponto"
              value={meta.evidencias_disponiveis || ''} onChange={e => setM({ evidencias_disponiveis: e.target.value })} />
          </div>

          <div className="space-y-2 rounded-md border p-4">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={!!meta.ha_risco_imediato_informado} onCheckedChange={v => setM({ ha_risco_imediato_informado: !!v })} />
              <span>Considero que há <b>risco grave e imediato</b> à saúde ou à segurança de alguém.</span>
            </label>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={!!meta.autorizacao_para_contato} onCheckedChange={v => setM({ autorizacao_para_contato: !!v })} />
              <span>Autorizo contato para complementação do relato.</span>
            </label>
            {meta.autorizacao_para_contato && (
              <Input placeholder="Canal de contato (e-mail ou telefone)"
                value={meta.canal_de_contato || ''} onChange={e => setM({ canal_de_contato: e.target.value })} />
            )}
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={!!meta.aceite_politica_privacidade} onCheckedChange={v => setM({ aceite_politica_privacidade: !!v })} />
              <span>Li e aceito a Política de Privacidade. *</span>
            </label>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={!!meta.declaracao_de_boa_fe} onCheckedChange={v => setM({ declaracao_de_boa_fe: !!v })} />
              <span>Declaro que o relato é feito de boa-fé. *</span>
            </label>
          </div>

          {meta.ha_risco_imediato_informado && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Risco imediato</AlertTitle>
              <AlertDescription>
                Se há risco à vida agora, acione <b>SAMU 192</b>, <b>Bombeiros 193</b>, <b>Polícia 190</b> ou <b>CVV 188</b>.
                Sua denúncia será tratada com prioridade crítica.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(snapshot ? 'confirm' : 'cpf')}>Voltar</Button>
            <Button onClick={() => setStep('chat')} disabled={!podeSeguir}>Continuar para o relato</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <ReportChat companyId={companyId} snapshot={anonymous ? null : snapshot} metadata={meta} />;
};

export default ReportWizard;
