import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Building2, Users, Link2, Link2Off } from "lucide-react";
import { toast } from "sonner";

interface CompanyRow {
  id: string;
  name: string;
  cnpj: string | null;
  soc_unit_code: string | null;
  soc_export_code: string | null;
}

interface EmployeeRow {
  id: string;
  company_id: string;
  cpf_last4: string | null;
  matricula: string | null;
  unidade: string | null;
  setor: string | null;
  ghe: string | null;
  cargo: string | null;
  cbo: string | null;
  situacao: string | null;
  synced_at: string;
}

const PAGE = 1000;

async function fetchAll<T>(build: (from: number, to: number) => any): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < PAGE) break;
  }
  return out;
}

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function SocDataCard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [counts, setCounts] = useState<Record<string, { total: number; last: string | null }>>({});
  const [search, setSearch] = useState("");
  const [linkFilter, setLinkFilter] = useState<"all" | "linked" | "unlinked">("all");

  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState("");

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const comps = await fetchAll<CompanyRow>((from, to) =>
        supabase.from("companies").select("id, name, cnpj, soc_unit_code, soc_export_code").order("name").range(from, to)
      );
      setCompanies(comps);

      const emps = await fetchAll<{ company_id: string; synced_at: string }>((from, to) =>
        supabase.from("soc_employees").select("company_id, synced_at").range(from, to)
      );
      const map: Record<string, { total: number; last: string | null }> = {};
      for (const e of emps) {
        const cur = map[e.company_id] || { total: 0, last: null };
        cur.total += 1;
        if (!cur.last || e.synced_at > cur.last) cur.last = e.synced_at;
        map[e.company_id] = cur;
      }
      setCounts(map);
    } catch (e: any) {
      toast.error("Erro ao carregar dados SOC", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadEmployees = async (companyId: string) => {
    if (!companyId) return;
    setEmpLoading(true);
    try {
      const rows = await fetchAll<EmployeeRow>((from, to) =>
        supabase
          .from("soc_employees")
          .select("id, company_id, cpf_last4, matricula, unidade, setor, ghe, cargo, cbo, situacao, synced_at")
          .eq("company_id", companyId)
          .order("cargo")
          .range(from, to)
      );
      setEmployees(rows);
    } catch (e: any) {
      toast.error("Erro ao carregar colaboradores", { description: e.message });
    } finally {
      setEmpLoading(false);
    }
  };

  const runLinkCompanies = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("soc-link-companies");
      if (error) throw error;
      toast.success("Vinculação concluída", {
        description: `${data?.matched ?? 0} empresas correspondidas, ${data?.updated ?? 0} atualizadas.`,
      });
      await loadCompanies();
    } catch (e: any) {
      toast.error("Falha na vinculação", { description: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const runSyncEmployees = async (companyId: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("soc-sync-company", {
        body: { company_id: companyId },
      });
      if (error) throw error;
      toast.success("Sincronização concluída", { description: `${data?.upserted ?? 0} colaboradores atualizados.` });
      await loadCompanies();
      if (selectedCompany === companyId) await loadEmployees(companyId);
    } catch (e: any) {
      toast.error("Falha na sincronização", { description: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (linkFilter === "linked" && !c.soc_unit_code) return false;
      if (linkFilter === "unlinked" && c.soc_unit_code) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.cnpj || "").replace(/\D/g, "").includes(q.replace(/\D/g, "") || "\u0000") ||
        (c.soc_unit_code || "").includes(q)
      );
    });
  }, [companies, search, linkFilter]);

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.matricula, e.unidade, e.setor, e.ghe, e.cargo, e.cbo, e.cpf_last4]
        .some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [employees, empSearch]);

  const totalLinked = companies.filter((c) => c.soc_unit_code).length;
  const totalEmployees = Object.values(counts).reduce((s, c) => s + c.total, 0);
  const companiesWithEmployees = Object.keys(counts).length;

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" /> Dados sincronizados do SOC
        </CardTitle>
        <CardDescription>
          Visualize os dois Exporta Dados: cadastro de empresas (código empresaTrabalho) e cadastro de colaboradores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Empresas cadastradas
                </div>
                <div className="text-2xl font-bold">{companies.length}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Vinculadas ao SOC
                </div>
                <div className="text-2xl font-bold">{totalLinked}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Colaboradores importados
                </div>
                <div className="text-2xl font-bold">{totalEmployees.toLocaleString("pt-BR")}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground">Empresas com colaboradores</div>
                <div className="text-2xl font-bold">{companiesWithEmployees}</div>
              </div>
            </div>

            <Tabs defaultValue="empresas">
              <TabsList className="mb-4">
                <TabsTrigger value="empresas">Exporta Dados 1 — Empresas</TabsTrigger>
                <TabsTrigger value="colaboradores">Exporta Dados 2 — Colaboradores</TabsTrigger>
              </TabsList>

              <TabsContent value="empresas">
                <div className="flex flex-wrap gap-3 mb-4">
                  <Input
                    placeholder="Buscar por nome, CNPJ ou código SOC..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={linkFilter} onValueChange={(v: any) => setLinkFilter(v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="linked">Somente vinculadas</SelectItem>
                      <SelectItem value="unlinked">Sem código SOC</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={runLinkCompanies} disabled={syncing}>
                    {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                    Revincular empresas (SOC)
                  </Button>
                  <Button variant="ghost" onClick={loadCompanies} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
                  </Button>
                </div>

                <div className="border rounded-lg max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Código SOC</TableHead>
                        <TableHead className="text-right">Colaboradores</TableHead>
                        <TableHead>Última sync</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.slice(0, 500).map((c) => {
                        const info = counts[c.id];
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-muted-foreground">{c.cnpj || "—"}</TableCell>
                            <TableCell>
                              {c.soc_unit_code ? (
                                <Badge variant="secondary">{c.soc_unit_code}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <Link2Off className="h-3 w-3 mr-1" /> não vinculada
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{info ? info.total.toLocaleString("pt-BR") : "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fmtDate(info?.last)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={syncing || !c.soc_unit_code}
                                  onClick={() => runSyncEmployees(c.id)}
                                >
                                  Sincronizar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedCompany(c.id);
                                    loadEmployees(c.id);
                                  }}
                                >
                                  Ver dados
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredCompanies.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhuma empresa encontrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {filteredCompanies.length > 500 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Exibindo 500 de {filteredCompanies.length} empresas — refine a busca.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="colaboradores">
                <div className="flex flex-wrap gap-3 mb-4">
                  <Select
                    value={selectedCompany}
                    onValueChange={(v) => {
                      setSelectedCompany(v);
                      loadEmployees(v);
                    }}
                  >
                    <SelectTrigger className="w-80">
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {companies
                        .filter((c) => counts[c.id])
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({counts[c.id].total})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Filtrar por setor, cargo, unidade, matrícula..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="max-w-sm"
                    disabled={!selectedCompany}
                  />
                  {selectedCompany && (
                    <Button variant="outline" onClick={() => runSyncEmployees(selectedCompany)} disabled={syncing}>
                      {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Resincronizar
                    </Button>
                  )}
                </div>

                {!selectedCompany ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">
                    Selecione uma empresa para ver os colaboradores sincronizados.
                  </p>
                ) : empLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      {companyName(selectedCompany)} — {filteredEmployees.length.toLocaleString("pt-BR")} registro(s).
                      Os CPFs são armazenados apenas como hash; exibimos os 4 últimos dígitos.
                    </p>
                    <div className="border rounded-lg max-h-[600px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead>CPF (final)</TableHead>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Setor</TableHead>
                            <TableHead>GHE</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>CBO</TableHead>
                            <TableHead>Situação</TableHead>
                            <TableHead>Sync</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmployees.slice(0, 500).map((e) => (
                            <TableRow key={e.id}>
                              <TableCell>•••{e.cpf_last4 || "—"}</TableCell>
                              <TableCell>{e.matricula || "—"}</TableCell>
                              <TableCell>{e.unidade || "—"}</TableCell>
                              <TableCell>{e.setor || "—"}</TableCell>
                              <TableCell>{e.ghe || "—"}</TableCell>
                              <TableCell>{e.cargo || "—"}</TableCell>
                              <TableCell>{e.cbo || "—"}</TableCell>
                              <TableCell>
                                <Badge variant={e.situacao === "Ativo" ? "secondary" : "outline"}>
                                  {e.situacao || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{fmtDate(e.synced_at)}</TableCell>
                            </TableRow>
                          ))}
                          {filteredEmployees.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                Nenhum colaborador encontrado.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {filteredEmployees.length > 500 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Exibindo 500 de {filteredEmployees.length} registros — use o filtro.
                      </p>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
