import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { toast } from "sonner";
import { RefreshCw, LogOut, Shield, FileText, Users, TrendingUp, CheckCircle, Clock, ArrowLeft, Settings, AlertTriangle } from "lucide-react";
import { getIndicacoes, getConsultores, Indicacao, Consultor, getUserRole, UserRole } from "@/lib/supabase-helpers";
import { getSLAStatus } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import logoCri from "@/assets/logo-cri.png";
import IndicacoesTab from "@/components/dashboard/IndicacoesTab";
import ConsultoresTab from "@/components/dashboard/ConsultoresTab";
import RelatoriosTab from "@/components/dashboard/RelatoriosTab";
import AdminTab from "@/components/dashboard/AdminTab";
import { ThemeToggle } from "@/components/ThemeToggle";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(false);
  const [descricaoModal, setDescricaoModal] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pendentes = indicacoes.filter(i => i.status === 'PENDENTE').length;
    const emAtendimento = indicacoes.filter(i => i.status === 'EM ATENDIMENTO').length;
    const fechados = indicacoes.filter(i => i.status === 'NEGÓCIO FECHADO').length;
    const consultoresAtivos = consultores.filter(c => c.ativo_na_roleta).length;
    const slaOverdue = indicacoes.filter(i => getSLAStatus(i.created_at, i.status) === "overdue").length;
    
    return { pendentes, emAtendimento, fechados, consultoresAtivos, total: indicacoes.length, slaOverdue };
  }, [indicacoes, consultores]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        setIsAuthenticated(false);
        setUserRole(null);
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
        setTimeout(() => fetchUserRole(), 0);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setIsAuthenticated(false);
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
        fetchUserRole();
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Realtime notifications
  useEffect(() => {
    if (!isAuthenticated || !userRole) return;

    const channel = supabase
      .channel("indicacoes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "indicacoes" },
        (payload) => {
          const nova = payload.new as Indicacao;
          toast.info(`Nova indicação: ${nova.nome_cliente}`, {
            description: `Corretor: ${nova.nome_corretor} • ${nova.cidade}`,
            duration: 6000,
          });
          setIndicacoes(prev => [nova, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "indicacoes" },
        (payload) => {
          const updated = payload.new as Indicacao;
          setIndicacoes(prev => prev.map(i => i.id === updated.id ? updated : i));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, userRole]);

  const fetchUserRole = async () => {
    try {
      const role = await getUserRole();
      if (role) {
        setUserRole(role);
      } else {
        toast.error("Você não tem permissão para acessar o dashboard.");
      }
    } catch {
      toast.error("Erro ao carregar permissões");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
    setIndicacoes([]);
    setConsultores([]);
    navigate("/auth");
  };

  const loadData = async () => {
    if (!userRole) return;
    setLoading(true);
    try {
      const [indicacoesData, consultoresData] = await Promise.all([
        getIndicacoes(userRole),
        getConsultores(userRole)
      ]);
      setIndicacoes(indicacoesData);
      setConsultores(consultoresData);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userRole) {
      loadData();
    }
  }, [isAuthenticated, userRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-96 mb-6" />
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <img src={logoCri} alt="Logo ADIM" className="mx-auto h-12 mb-4" />
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sua conta não possui permissões para acessar o dashboard.
              Entre em contato com um administrador.
            </p>
            <div className="flex gap-2 justify-center">
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao formulário
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <img src={logoCri} alt="Logo ADIM" className="h-10" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
                <div className="flex items-center gap-2">
                  <Badge variant={userRole.tipo === 'DIRETOR' ? 'default' : 'secondary'} className="gap-1">
                    <Shield className="w-3 h-3" />
                    {userRole.nome}
                  </Badge>
                  {userRole.tipo === 'GERENTE' && (
                    <span className="text-xs text-muted-foreground">
                      ({userRole.cidades.join(', ')})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Formulário
                </Button>
              </Link>
              <ThemeToggle />
              <Button onClick={loadData} disabled={loading} size="sm" variant="outline" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="destructive" onClick={handleLogout} size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        {/* SLA Alert */}
        {stats.slaOverdue > 0 && (
          <div className="mb-6 p-4 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">
                {stats.slaOverdue} indicação(ões) pendente(s) há mais de 48h
              </p>
              <p className="text-sm text-muted-foreground">
                Verifique a aba Indicações para priorizar o atendimento.
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <StatsCard title="Total de Indicações" value={stats.total} icon={FileText} description="Todas as indicações" className="animate-fade-in" />
          <StatsCard title="Pendentes" value={stats.pendentes} icon={Clock} description="Aguardando atendimento" className="animate-fade-in" />
          <StatsCard title="Negócios Fechados" value={stats.fechados} icon={CheckCircle} description="Convertidos em negócio" className="animate-fade-in" />
          <StatsCard title="Consultores Ativos" value={stats.consultoresAtivos} icon={Users} description="Na roleta de sorteio" className="animate-fade-in" />
          <StatsCard
            title="SLA em Atraso"
            value={stats.slaOverdue}
            icon={AlertTriangle}
            description="Pendentes >48h"
            className={`animate-fade-in ${stats.slaOverdue > 0 ? 'border-destructive/30' : ''}`}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="indicacoes" className="animate-fade-in">
          <TabsList className="mb-6 flex-wrap h-auto gap-2 bg-muted/50 p-1">
            <TabsTrigger value="indicacoes" className="gap-2 data-[state=active]:bg-background">
              <FileText className="w-4 h-4" />
              Indicações
              <Badge variant="secondary" className="ml-1">{indicacoes.length}</Badge>
              {stats.slaOverdue > 0 && (
                <Badge variant="destructive" className="ml-1">{stats.slaOverdue}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="consultores" className="gap-2 data-[state=active]:bg-background">
              <Users className="w-4 h-4" />
              Consultores
              <Badge variant="secondary" className="ml-1">{consultores.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-2 data-[state=active]:bg-background">
              <TrendingUp className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            {userRole.tipo === 'DIRETOR' && (
              <TabsTrigger value="admin" className="gap-2 data-[state=active]:bg-background">
                <Settings className="w-4 h-4" />
                Administradores
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="indicacoes" className="animate-fade-in">
            <IndicacoesTab 
              indicacoes={indicacoes} 
              consultores={consultores}
              onRefresh={loadData}
              onVerDescricao={setDescricaoModal}
            />
          </TabsContent>

          <TabsContent value="consultores" className="animate-fade-in">
            <ConsultoresTab consultores={consultores} onRefresh={loadData} userRole={userRole} />
          </TabsContent>

          <TabsContent value="relatorios" className="animate-fade-in">
            <RelatoriosTab indicacoes={indicacoes} consultores={consultores} />
          </TabsContent>

          {userRole.tipo === 'DIRETOR' && (
            <TabsContent value="admin" className="animate-fade-in">
              <AdminTab />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Dialog open={!!descricaoModal} onOpenChange={() => setDescricaoModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Descrição da Situação
            </DialogTitle>
            <DialogDescription className="whitespace-pre-wrap pt-4 text-foreground">
              {descricaoModal}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
