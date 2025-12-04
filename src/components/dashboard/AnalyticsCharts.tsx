import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Indicacao, Consultor } from "@/lib/supabase-helpers";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Users, Target, CheckCircle, Clock } from "lucide-react";

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
  // KPIs
  const kpis = useMemo(() => {
    const total = indicacoes.length;
    const fechados = indicacoes.filter(i => i.status === "NEGÓCIO FECHADO").length;
    const pendentes = indicacoes.filter(i => i.status === "PENDENTE").length;
    const emAtendimento = indicacoes.filter(i => i.status === "EM ATENDIMENTO").length;
    const taxaConversao = total > 0 ? ((fechados / total) * 100).toFixed(1) : "0";
    
    return { total, fechados, pendentes, emAtendimento, taxaConversao };
  }, [indicacoes]);

  // Dados para gráfico de barras - Indicações por mês (últimos 6 meses)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const count = indicacoes.filter(ind => {
        const indDate = parseISO(ind.created_at);
        return isWithinInterval(indDate, { start, end });
      }).length;
      
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        fullMonth: format(date, "MMMM yyyy", { locale: ptBR }),
        indicacoes: count,
      });
    }
    return months;
  }, [indicacoes]);

  // Dados para gráfico de pizza - Distribuição por status
  const statusData = useMemo(() => {
    const statusCount: Record<string, number> = {};
    indicacoes.forEach(ind => {
      statusCount[ind.status] = (statusCount[ind.status] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status] || "hsl(var(--muted))",
    }));
  }, [indicacoes]);

  // Dados para gráfico de linha - Tendência temporal (últimos 6 meses)
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthIndicacoes = indicacoes.filter(ind => {
        const indDate = parseISO(ind.created_at);
        return isWithinInterval(indDate, { start, end });
      });
      
      const fechados = monthIndicacoes.filter(i => i.status === "NEGÓCIO FECHADO").length;
      const pendentes = monthIndicacoes.filter(i => i.status === "PENDENTE").length;
      
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        fechados,
        pendentes,
        total: monthIndicacoes.length,
      });
    }
    return months;
  }, [indicacoes]);

  // Ranking de consultores
  const consultorRanking = useMemo(() => {
    const ranking: Record<string, { total: number; fechados: number; nome: string }> = {};
    
    indicacoes.forEach(ind => {
      if (ind.consultor_nome) {
        if (!ranking[ind.consultor_nome]) {
          ranking[ind.consultor_nome] = { total: 0, fechados: 0, nome: ind.consultor_nome };
        }
        ranking[ind.consultor_nome].total++;
        if (ind.status === "NEGÓCIO FECHADO") {
          ranking[ind.consultor_nome].fechados++;
        }
      }
    });
    
    return Object.values(ranking)
      .map(r => ({
        ...r,
        taxa: r.total > 0 ? ((r.fechados / r.total) * 100).toFixed(0) : "0",
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [indicacoes]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (indicacoes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* KPIs Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
              </div>
              <Target className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fechados</p>
                <p className="text-2xl font-bold text-green-600">{kpis.fechados}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{kpis.pendentes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversão</p>
                <p className="text-2xl font-bold text-blue-600">{kpis.taxaConversao}%</p>
              </div>
              {Number(kpis.taxaConversao) >= 50 ? (
                <TrendingUp className="h-8 w-8 text-blue-500 opacity-80" />
              ) : (
                <TrendingDown className="h-8 w-8 text-blue-500 opacity-80" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Indicações por Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indicações por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="indicacoes" 
                    name="Indicações"
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Linha - Tendência Temporal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendência Temporal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fechados" 
                    name="Fechados"
                    stroke="hsl(142, 71%, 45%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142, 71%, 45%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ranking de Consultores */}
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
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum consultor com indicações no período.
                </p>
              ) : (
                consultorRanking.map((consultor, index) => (
                  <div 
                    key={consultor.nome} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-8">
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {index > 2 && `${index + 1}º`}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{consultor.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {consultor.fechados} fechados de {consultor.total}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{consultor.total}</p>
                      <p className="text-xs text-muted-foreground">{consultor.taxa}% conversão</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
