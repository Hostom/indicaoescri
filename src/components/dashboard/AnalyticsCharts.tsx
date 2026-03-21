import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Indicacao, Consultor } from "@/lib/supabase-helpers";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Users, Target, CheckCircle, Clock, Award, Timer } from "lucide-react";

interface AnalyticsChartsProps {
  indicacoes: Indicacao[];
  consultores: Consultor[];
}

const STATUS_COLORS: Record<string, string> = {
  "PENDENTE": "hsl(45, 93%, 47%)",
  "EM ATENDIMENTO": "hsl(217, 91%, 60%)",
  "NEGÓCIO FECHADO": "hsl(142, 71%, 45%)",
  "CANCELADA": "hsl(0, 84%, 60%)",
};

const AnalyticsCharts = ({ indicacoes, consultores }: AnalyticsChartsProps) => {
  const kpis = useMemo(() => {
    const total = indicacoes.length;
    const fechados = indicacoes.filter(i => i.status === "NEGÓCIO FECHADO").length;
    const pendentes = indicacoes.filter(i => i.status === "PENDENTE").length;
    const emAtendimento = indicacoes.filter(i => i.status === "EM ATENDIMENTO").length;
    const taxaConversao = total > 0 ? ((fechados / total) * 100).toFixed(1) : "0";

    // Tempo médio pendente (horas)
    const pendentesItems = indicacoes.filter(i => i.status === "PENDENTE");
    const avgPendingHours = pendentesItems.length > 0
      ? Math.round(pendentesItems.reduce((sum, i) => sum + differenceInHours(new Date(), parseISO(i.created_at)), 0) / pendentesItems.length)
      : 0;

    return { total, fechados, pendentes, emAtendimento, taxaConversao, avgPendingHours };
  }, [indicacoes]);

  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthInds = indicacoes.filter(ind => isWithinInterval(parseISO(ind.created_at), { start, end }));
      const fechados = monthInds.filter(i => i.status === "NEGÓCIO FECHADO").length;
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        indicacoes: monthInds.length,
        fechados,
        taxa: monthInds.length > 0 ? Math.round((fechados / monthInds.length) * 100) : 0,
      });
    }
    return months;
  }, [indicacoes]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    indicacoes.forEach(ind => { counts[ind.status] = (counts[ind.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: status, value: count, color: STATUS_COLORS[status] || "hsl(var(--muted))",
    }));
  }, [indicacoes]);

  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthInds = indicacoes.filter(ind => isWithinInterval(parseISO(ind.created_at), { start, end }));
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        fechados: monthInds.filter(i => i.status === "NEGÓCIO FECHADO").length,
        pendentes: monthInds.filter(i => i.status === "PENDENTE").length,
        total: monthInds.length,
      });
    }
    return months;
  }, [indicacoes]);

  const consultorRanking = useMemo(() => {
    const ranking: Record<string, { total: number; fechados: number; nome: string }> = {};
    indicacoes.forEach(ind => {
      if (ind.consultor_nome) {
        if (!ranking[ind.consultor_nome]) ranking[ind.consultor_nome] = { total: 0, fechados: 0, nome: ind.consultor_nome };
        ranking[ind.consultor_nome].total++;
        if (ind.status === "NEGÓCIO FECHADO") ranking[ind.consultor_nome].fechados++;
      }
    });
    return Object.values(ranking)
      .map(r => ({ ...r, taxa: r.total > 0 ? Math.round((r.fechados / r.total) * 100) : 0 }))
      .sort((a, b) => b.fechados - a.fechados || b.total - a.total)
      .slice(0, 8);
  }, [indicacoes]);

  const bestConsultor = consultorRanking.length > 0 ? consultorRanking[0] : null;
  const maxTotal = consultorRanking.length > 0 ? Math.max(...consultorRanking.map(c => c.total)) : 1;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">{entry.name}: {entry.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (indicacoes.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-foreground">{kpis.total}</p></div>
              <Target className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Fechados</p><p className="text-2xl font-bold text-success">{kpis.fechados}</p></div>
              <CheckCircle className="h-8 w-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-warning">{kpis.pendentes}</p></div>
              <Clock className="h-8 w-8 text-warning opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Conversão</p><p className="text-2xl font-bold text-primary">{kpis.taxaConversao}%</p></div>
              {Number(kpis.taxaConversao) >= 50 ? <TrendingUp className="h-8 w-8 text-primary opacity-80" /> : <TrendingDown className="h-8 w-8 text-primary opacity-80" />}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-muted to-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Tempo Médio</p><p className="text-2xl font-bold text-foreground">{kpis.avgPendingHours}h</p></div>
              <Timer className="h-8 w-8 text-muted-foreground opacity-80" />
            </div>
          </CardContent>
        </Card>
        {bestConsultor && (
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Top Consultor</p><p className="text-sm font-bold text-foreground truncate">{bestConsultor.nome}</p><p className="text-xs text-muted-foreground">{bestConsultor.fechados} fechados</p></div>
                <Award className="h-8 w-8 text-accent opacity-80" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Indicações por Mês</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => <span className="text-sm text-foreground">{value}</span>} />
                  <Bar dataKey="indicacoes" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fechados" name="Fechados" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name]} contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-sm text-foreground">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tendência Temporal</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => <span className="text-sm text-foreground">{value}</span>} />
                  <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  <Line type="monotone" dataKey="fechados" name="Fechados" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ranking de Consultores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consultorRanking.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum consultor com indicações.</p>
              ) : (
                consultorRanking.map((consultor, index) => (
                  <div key={consultor.nome} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold w-6">
                          {index === 0 && "🥇"}{index === 1 && "🥈"}{index === 2 && "🥉"}{index > 2 && `${index + 1}º`}
                        </span>
                        <span className="text-sm font-medium text-foreground">{consultor.nome}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{consultor.fechados}/{consultor.total} fechados</span>
                        <span className="font-semibold text-foreground">{consultor.taxa}%</span>
                      </div>
                    </div>
                    <Progress value={(consultor.total / maxTotal) * 100} className="h-2" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate by Month */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Taxa de Conversão Mensal (%)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="taxa" name="Conversão (%)" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
