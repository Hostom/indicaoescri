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
import { toast } from "sonner";
import { Plus, Trash2, Shield } from "lucide-react";
import { AdminUser, getAdminUsers, createAdminUser, removeAdminUser } from "@/lib/supabase-helpers";
import { z } from "zod";

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

const AdminTab = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [novoAdmin, setNovoAdmin] = useState({
    email: "",
    password: "",
    nome: "",
    role: "GERENTE" as "DIRETOR" | "GERENTE",
    cidades: [] as string[]
  });

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
  }, []);

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
    if (!confirm(`Tem certeza que deseja remover ${admin.nome}?`)) return;

    try {
      await removeAdminUser(admin.id);
      toast.success("Administrador removido com sucesso!");
      loadAdminUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover administrador");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Gerenciar Administradores
        </CardTitle>
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Administrador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Administrador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={novoAdmin.email}
                  onChange={(e) => setNovoAdmin({ ...novoAdmin, email: e.target.value })}
                  placeholder="admin@exemplo.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={novoAdmin.password}
                  onChange={(e) => setNovoAdmin({ ...novoAdmin, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
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
                  <div className="space-y-2 p-3 border rounded-md">
                    {cidades.map((cidade) => (
                      <div key={cidade} className="flex items-center space-x-2">
                        <Checkbox
                          id={cidade}
                          checked={novoAdmin.cidades.includes(cidade)}
                          onCheckedChange={(checked) => handleCidadeToggle(cidade, checked as boolean)}
                        />
                        <label htmlFor={cidade} className="text-sm cursor-pointer">
                          {cidade}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.cidades && <p className="text-sm text-destructive">{errors.cidades}</p>}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button onClick={handleAdicionarAdmin} className="flex-1" disabled={loading}>
                  {loading ? "Criando..." : "Criar Administrador"}
                </Button>
                <Button variant="secondary" onClick={() => setOpenModal(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cidades com Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum administrador cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                adminUsers.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.nome}</TableCell>
                    <TableCell>
                      <Badge variant={admin.role === 'DIRETOR' ? 'default' : 'secondary'}>
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admin.role === 'DIRETOR' ? (
                        <span className="text-muted-foreground">Todas</span>
                      ) : (
                        admin.cidades?.join(', ') || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoverAdmin(admin)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTab;