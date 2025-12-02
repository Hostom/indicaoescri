import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, LogOut, Shield } from "lucide-react";
import { getIndicacoes, getConsultores, Indicacao, Consultor, verificarSenha, UserRole } from "@/lib/supabase-helpers";
import logoCri from "@/assets/logo-cri.png";
import IndicacoesTab from "@/components/dashboard/IndicacoesTab";
import ConsultoresTab from "@/components/dashboard/ConsultoresTab";
import RelatoriosTab from "@/components/dashboard/RelatoriosTab";
import AdminTab from "@/components/dashboard/AdminTab";

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal de descrição
  const [descricaoModal, setDescricaoModal] = useState<string | null>(null);

  const handleLogin = async () => {
    const role = await verificarSenha(password);
    if (role) {
      setIsAuthenticated(true);
      setUserRole(role);
      setPasswordError(false);
      toast.success(`Bem-vindo, ${role.nome}!`);
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setPassword("");
    setIndicacoes([]);
    setConsultores([]);
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

  // Modal de Login
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <img src={logoCri} alt="Logo ADIM" className="mx-auto h-12 mb-4" />
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Insira a senha do dashboard para continuar.
            </p>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full">
              Entrar
            </Button>
            {passwordError && (
              <p className="text-destructive text-sm text-center">Senha incorreta.</p>
            )}
            <Link to="/" className="block text-center text-primary hover:underline text-sm">
              ← Voltar ao formulário
            </Link>
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
                <Badge variant={userRole?.tipo === 'DIRETOR' ? 'default' : 'secondary'}>
                  <Shield className="w-3 h-3 mr-1" />
                  {userRole?.nome}
                </Badge>
                {userRole?.tipo === 'GERENTE' && (
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
            {userRole?.tipo === 'DIRETOR' && (
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

          {userRole?.tipo === 'DIRETOR' && (
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
