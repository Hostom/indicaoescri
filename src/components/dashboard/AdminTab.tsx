import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Plus, Trash2, Shield, UserCog, Users } from "lucide-react";
import { AdminUser, getAdminUsers, createAdminUser, removeAdminUser, createIndicadorUser, getIndicadores } from "@/lib/supabase-helpers";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const cidades = ['Balneario Camboriu', 'Itajai', 'Itapema'];

const newAdminSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.enum(["DIRETOR", "GERENTE"]),
  cidades: z.array(z.string()),
}).refine((data) => {
  if (data.role === "GERENTE" && data.cidades.length === 0) {
    return false;
  }
  return true;
}, {
  message: "Selecione pelo menos uma cidade para o gerente",
  path: ["cidades"],
});

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const AdminTab = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [indicadores, setIndicadores] = useState<AdminUser[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [openIndicadorModal, setOpenIndicadorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [novoAdmin, setNovoAdmin] = useState({
    email: "",
    password: "",
    nome: "",
    role: "GERENTE" as "DIRETOR" | "GERENTE",
    cidades: [] as string[]
  });
  const [novoIndicador, setNovoIndicador] = useState({ email: "", password: "", nome: "" });

  const loadAdminUsers = async () => {
    try {
      const data = await getAdminUsers();
      setAdminUsers(data);
    } catch (error) {
      toast.error("Erro ao carregar administradores");
    }
  };

  useEffect(() => {
    loadAdminUsers();
    loadIndicadores();
  }, []);

  const loadIndicadores = async () => {
    try {
      const data = await getIndicadores();
      setIndicadores(data);
    } catch {
      // silent
    }
  };

  const handleCidadeToggle = (cidade: string, checked: boolean) => {
    if (checked) {
      setNovoAdmin({ ...novoAdmin, cidades: [...novoAdmin.cidades, cidade] });
    } else {
      setNovoAdmin({ ...novoAdmin, cidades: novoAdmin.cidades.filter(c => c !== cidade) });
    }
  };

  const validateForm = () => {
    try {
      newAdminSchema.parse(novoAdmin);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleAdicionarAdmin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await createAdminUser(novoAdmin);
      toast.success("Administrador criado com sucesso!");
      setOpenModal(false);
      setNovoAdmin({ email: "", password: "", nome: "", role: "GERENTE", cidades: [] });
      setErrors({});
      loadAdminUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar administrador");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverAdmin = async (admin: AdminUser) => {
    try {
      await removeAdminUser(admin.id);
      toast.success("Administrador removido com sucesso!");
      loadAdminUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover administrador");
    }
  };
  const handleAdicionarIndicador = async () => {
    if (!novoIndicador.email || !novoIndicador.password || !novoIndicador.nome) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (novoIndicador.password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await createIndicadorUser(novoIndicador);
      toast.success("Indicador criado com sucesso!");
      setOpenIndicadorModal(false);
      setNovoIndicador({ email: "", password: "", nome: "" });
      loadIndicadores();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar indicador");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverIndicador = async (indicador: AdminUser) => {
    try {
      await removeAdminUser(indicador.id);
      toast.success("Indicador removido!");
      loadIndicadores();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover indicador");
    }
  };

  return (
    <div className="space-y-8">
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Gerenciar Administradores
        </CardTitle>
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Administrador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Administrador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={novoAdmin.email}
                  onChange={(e) => setNovoAdmin({ ...novoAdmin, email: e.target.value })}
                  placeholder="admin@exemplo.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label>Senha <span className="text-destructive">*</span></Label>
                <Input
                  type="password"
                  value={novoAdmin.password}
                  onChange={(e) => setNovoAdmin({ ...novoAdmin, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nome <span className="text-destructive">*</span></Label>
                <Input
                  value={novoAdmin.nome}
                  onChange={(e) => setNovoAdmin({ ...novoAdmin, nome: e.target.value })}
                  placeholder="Ex: Gerente Itapema"
                />
                {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={novoAdmin.role}
                  onValueChange={(value: "DIRETOR" | "GERENTE") => 
                    setNovoAdmin({ ...novoAdmin, role: value, cidades: value === 'DIRETOR' ? [] : novoAdmin.cidades })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRETOR">Diretor (acesso total)</SelectItem>
                    <SelectItem value="GERENTE">Gerente (acesso por cidade)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {novoAdmin.role === 'GERENTE' && (
                <div className="space-y-2">
                  <Label>Cidades com Acesso</Label>
                  <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                    {cidades.map((cidade) => (
                      <div key={cidade} className="flex items-center space-x-2">
                        <Checkbox
                          id={cidade}
                          checked={novoAdmin.cidades.includes(cidade)}
                          onCheckedChange={(checked) => handleCidadeToggle(cidade, checked as boolean)}
                        />
                        <label htmlFor={cidade} className="text-sm cursor-pointer">
                          {cidade === 'Balneario Camboriu' ? 'Balneário Camboriú' : cidade}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.cidades && <p className="text-sm text-destructive">{errors.cidades}</p>}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAdicionarAdmin} className="flex-1" disabled={loading}>
                  {loading ? "Criando..." : "Criar Administrador"}
                </Button>
                <Button variant="outline" onClick={() => setOpenModal(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {adminUsers.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="Nenhum administrador cadastrado"
            description="Adicione administradores para gerenciar o sistema"
            action={
              <Button onClick={() => setOpenModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Administrador
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Administrador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cidades com Acesso</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`text-sm font-medium ${admin.role === 'DIRETOR' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                            {getInitials(admin.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{admin.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.role === 'DIRETOR' ? 'default' : 'secondary'}>
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admin.role === 'DIRETOR' ? (
                        <span className="text-muted-foreground">Todas as cidades</span>
                      ) : (
                        <span className="text-sm">{admin.cidades?.map(c => c === 'Balneario Camboriu' ? 'BC' : c).join(', ') || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover <strong>{admin.nome}</strong>? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoverAdmin(admin)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminTab;
