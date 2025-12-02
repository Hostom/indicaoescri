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
import { Plus, Trash2, Shield, Eye, EyeOff } from "lucide-react";
import { Administrador, getAdministradores, adicionarAdministrador, removerAdministrador } from "@/lib/supabase-helpers";

const cidades = ['Balneario Camboriu', 'Itajai', 'Itapema'];

const AdminTab = () => {
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [novoAdmin, setNovoAdmin] = useState({
    nome: "",
    senha: "",
    tipo: "GERENTE",
    cidades: [] as string[]
  });

  const loadAdministradores = async () => {
    try {
      const data = await getAdministradores();
      setAdministradores(data);
    } catch (error) {
      toast.error("Erro ao carregar administradores");
    }
  };

  useEffect(() => {
    loadAdministradores();
  }, []);

  const handleCidadeToggle = (cidade: string, checked: boolean) => {
    if (checked) {
      setNovoAdmin({ ...novoAdmin, cidades: [...novoAdmin.cidades, cidade] });
    } else {
      setNovoAdmin({ ...novoAdmin, cidades: novoAdmin.cidades.filter(c => c !== cidade) });
    }
  };

  const handleAdicionarAdmin = async () => {
    if (!novoAdmin.nome || !novoAdmin.senha || !novoAdmin.tipo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (novoAdmin.tipo === 'GERENTE' && novoAdmin.cidades.length === 0) {
      toast.error("Selecione pelo menos uma cidade para o gerente");
      return;
    }

    setLoading(true);
    try {
      await adicionarAdministrador(novoAdmin);
      toast.success("Administrador adicionado com sucesso!");
      setOpenModal(false);
      setNovoAdmin({ nome: "", senha: "", tipo: "GERENTE", cidades: [] });
      loadAdministradores();
    } catch (error) {
      toast.error("Erro ao adicionar administrador");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverAdmin = async (admin: Administrador) => {
    if (!confirm(`Tem certeza que deseja remover ${admin.nome}?`)) return;

    try {
      await removerAdministrador(admin.id);
      toast.success("Administrador removido com sucesso!");
      loadAdministradores();
    } catch (error) {
      toast.error("Erro ao remover administrador");
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
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
                <Label>Nome</Label>
                <Input
                  value={novoAdmin.nome}
                  onChange={(e) => setNovoAdmin({ ...novoAdmin, nome: e.target.value })}
                  placeholder="Ex: Gerente Itapema"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha de Acesso</Label>
                <Input
                  value={novoAdmin.senha}
                  onChange={(e) => setNovoAdmin({ ...novoAdmin, senha: e.target.value })}
                  placeholder="Senha para login no dashboard"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={novoAdmin.tipo}
                  onValueChange={(value) => setNovoAdmin({ ...novoAdmin, tipo: value, cidades: value === 'DIRETOR' ? [] : novoAdmin.cidades })}
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
              
              {novoAdmin.tipo === 'GERENTE' && (
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
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button onClick={handleAdicionarAdmin} className="flex-1" disabled={loading}>
                  {loading ? "Adicionando..." : "Adicionar"}
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
                <TableHead>Senha</TableHead>
                <TableHead>Cidades com Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {administradores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum administrador cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                administradores.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.nome}</TableCell>
                    <TableCell>
                      <Badge variant={admin.tipo === 'DIRETOR' ? 'default' : 'secondary'}>
                        {admin.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {showPasswords[admin.id] ? admin.senha : '••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(admin.id)}
                        >
                          {showPasswords[admin.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.tipo === 'DIRETOR' ? (
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
