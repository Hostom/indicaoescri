import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, LogOut, Shield } from "lucide-react";
import { getIndicacoes, getConsultores, Indicacao, Consultor, getUserRole, UserRole } from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";
import logoCri from "@/assets/logo-cri.png";
import IndicacoesTab from "@/components/dashboard/IndicacoesTab";
import ConsultoresTab from "@/components/dashboard/ConsultoresTab";
import RelatoriosTab from "@/components/dashboard/RelatoriosTab";
import AdminTab from "@/components/dashboard/AdminTab";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal de descrição
  const [descricaoModal, setDescricaoModal] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        setIsAuthenticated(false);
        setUserRole(null);
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
        // Defer role fetch to avoid deadlock
        setTimeout(() => {
          fetchUserRole();
        }, 0);
      }
      setIsLoading(false);
    });

    // Then check for existing session
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

  const fetchUserRole = async () => {
    try {
      const role = await getUserRole();
      if (role) {
        setUserRole(role);
      } else {
        // User is authenticated but has no role - show message
        toast.error("Você não tem permissão para acessar o dashboard. Contate um administrador.");
      }
    } catch (error) {
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
    } catch (error) {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return null;
  }

  // No role assigned
  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
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
                <Button variant="outline">← Voltar ao formulário</Button>
              </Link>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
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
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <img src={logoCri} alt="Logo ADIM" className="h-10" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dashboard de Indicações</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={userRole.tipo === 'DIRETOR' ? 'default' : 'secondary'}>
                  <Shield className="w-3 h-3 mr-1" />
                  {userRole.nome}
                </Badge>
                {userRole.tipo === 'GERENTE' && (
                  <span className="text-sm text-muted-foreground">
                    ({userRole.cidades.join(', ')})
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/">
              <Button variant="outline">← Formulário</Button>
            </Link>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="indicacoes">
          <TabsList className="mb-6">
            <TabsTrigger value="indicacoes" className="px-6">Indicações</TabsTrigger>
            <TabsTrigger value="consultores" className="px-6">Consultores</TabsTrigger>
            <TabsTrigger value="relatorios" className="px-6">Relatórios</TabsTrigger>
            {userRole.tipo === 'DIRETOR' && (
              <TabsTrigger value="admin" className="px-6">Administradores</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="indicacoes">
            <IndicacoesTab 
              indicacoes={indicacoes} 
              onRefresh={loadData}
              onVerDescricao={setDescricaoModal}
            />
          </TabsContent>

          <TabsContent value="consultores">
            <ConsultoresTab 
              consultores={consultores}
              onRefresh={loadData}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="relatorios">
            <RelatoriosTab 
              indicacoes={indicacoes}
              consultores={consultores}
            />
          </TabsContent>

          {userRole.tipo === 'DIRETOR' && (
            <TabsContent value="admin">
              <AdminTab />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modal de Descrição */}
      <Dialog open={!!descricaoModal} onOpenChange={() => setDescricaoModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descrição da Situação</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap pt-4">
              {descricaoModal}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;