import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LogOut, TrendingUp, DollarSign, Clock, CheckCircle, FileText, ArrowLeft, Calendar } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { format, parseISO, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoCri from "@/assets/logo-cri.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface IndicacaoIndicador {
  id: string;
  nome_cliente: string;
  natureza: string;
  cidade: string;
  status: string;
  created_at: string;
  valor_negocio: number | null;
  percentual_comissao: number | null;
  valor_comissao: number | null;
  status_comissao: string | null;
  data_pagamento: string | null;
  consultor_nome: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDENTE': return 'bg-warning/10 text-warning border-warning/20';
    case 'EM ATENDIMENTO': return 'bg-primary/10 text-primary border-primary/20';
    case 'NEGÓCIO FECHADO': return 'bg-success/10 text-success border-success/20';
    case 'CANCELADA': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getComissaoColor = (status: string | null) => {
  switch (status) {
    case 'INDICADO': return 'bg-primary/10 text-primary border-primary/20';
    case 'A_PAGAR': return 'bg-warning/10 text-warning border-warning/20';
    case 'PAGO': return 'bg-success/10 text-success border-success/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const comissaoLabel = (status: string | null) => {
  switch (status) {
    case 'INDICADO': return 'Previsto';
    case 'A_PAGAR': return 'A Pagar';
    case 'PAGO': return 'Pago';
    default: return '-';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const PainelIndicador = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [indicacoes, setIndicacoes] = useState<IndicacaoIndicador[]>([]);
  const [userName, setUserName] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/painel-login");
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, nome')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== 'INDICADOR') {
      toast.error("Acesso não autorizado");
      navigate("/painel-login");
      return;
    }

    setUserName(roleData.nome);
    await loadIndicacoes();
  };

  const loadIndicacoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('indicacoes')
        .select('id, nome_cliente, natureza, cidade, status, created_at, valor_negocio, percentual_comissao, valor_comissao, status_comissao, data_pagamento, consultor_nome')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIndicacoes(data || []);
    } catch {
      toast.error("Erro ao carregar indicações");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/painel-login");
  };

  // KPIs
  const stats = useMemo(() => {
    const total = indicacoes.length;
    const previsto = indicacoes
      .filter(i => i.status_comissao === 'INDICADO')
      .reduce((sum, i) => sum + (i.valor_comissao || 0), 0);
    const aPagar = indicacoes
      .filter(i => i.status_comissao === 'A_PAGAR')
      .reduce((sum, i) => sum + (i.valor_comissao || 0), 0);
    const pago = indicacoes
      .filter(i => i.status_comissao === 'PAGO')
      .reduce((sum, i) => sum + (i.valor_comissao || 0), 0);

    return { total, previsto, aPagar, pago };
  }, [indicacoes]);

  const animTotal = useCountUp(stats.total);

  // Chart data - commissions by month for selected year
  const chartData = useMemo(() => {
    const year = parseInt(selectedYear);
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: format(new Date(year, i, 1), 'MMM', { locale: ptBR }),
      previsto: 0,
      aPagar: 0,
      pago: 0,
    }));

    indicacoes.forEach(ind => {
      const date = parseISO(ind.created_at);
      if (getYear(date) !== year || !ind.valor_comissao) return;
      const m = getMonth(date);
      if (ind.status_comissao === 'INDICADO') months[m].previsto += ind.valor_comissao;
      else if (ind.status_comissao === 'A_PAGAR') months[m].aPagar += ind.valor_comissao;
      else if (ind.status_comissao === 'PAGO') months[m].pago += ind.valor_comissao;
    });

    return months;
  }, [indicacoes, selectedYear]);

  const years = useMemo(() => {
    const set = new Set(indicacoes.map(i => getYear(parseISO(i.created_at))));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [indicacoes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoCri} alt="Logo CRI" className="h-10" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground">Olá, {userName}</p>
              <p className="text-xs text-muted-foreground">Painel do Indicador</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Indicar</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Indicações"
            value={animTotal}
            icon={FileText}
            description="Todas as suas indicações"
            className="animate-fade-in"
          />
          <StatsCard
            title="Comissão Prevista"
            value={formatCurrency(stats.previsto)}
            icon={TrendingUp}
            description="Negócios em andamento"
            className="animate-fade-in"
          />
          <StatsCard
            title="A Pagar"
            value={formatCurrency(stats.aPagar)}
            icon={Clock}
            description="Aguardando pagamento"
            className="animate-fade-in"
          />
          <StatsCard
            title="Pago"
            value={formatCurrency(stats.pago)}
            icon={CheckCircle}
            description="Comissões recebidas"
            className="animate-fade-in"
          />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Comissões por Mês
            </CardTitle>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <Calendar className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aPagar" name="A Pagar" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pago" name="Pago" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Minhas Indicações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {indicacoes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nenhuma indicação encontrada"
                description="Suas indicações aparecerão aqui quando forem cadastradas."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Natureza</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Consultor</TableHead>
                      <TableHead className="text-right">Valor Negócio</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indicacoes.map((ind, idx) => (
                      <TableRow key={ind.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(parseISO(ind.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{ind.nome_cliente}</TableCell>
                        <TableCell>{ind.natureza}</TableCell>
                        <TableCell>{ind.cidade}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(ind.status)}>
                            {ind.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ind.consultor_nome || '-'}</TableCell>
                        <TableCell className="text-right">
                          {ind.valor_negocio ? formatCurrency(ind.valor_negocio) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {ind.valor_comissao ? formatCurrency(ind.valor_comissao) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getComissaoColor(ind.status_comissao)}>
                            {comissaoLabel(ind.status_comissao)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        GRUPO CRI/ADIM &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default PainelIndicador;
