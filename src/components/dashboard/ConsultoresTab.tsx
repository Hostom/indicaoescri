import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Consultor, toggleConsultorAtivo, adicionarConsultor, removerConsultor, UserRole } from "@/lib/supabase-helpers";

interface ConsultoresTabProps {
  consultores: Consultor[];
  onRefresh: () => void;
  userRole?: UserRole | null;
}

const todasCidades = ['Balneario Camboriu', 'Itajai', 'Itapema'];

const ConsultoresTab = ({ consultores, onRefresh, userRole }: ConsultoresTabProps) => {
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [novoConsultor, setNovoConsultor] = useState({
    nome: "",
    email: "",
    natureza: "",
    cidade: ""
  });

  // Cidades disponíveis baseado no userRole
  const cidadesDisponiveis = userRole?.tipo === 'DIRETOR' 
    ? todasCidades 
    : (userRole?.cidades || todasCidades);

  const handleToggleAtivo = async (consultor: Consultor) => {
    try {
      await toggleConsultorAtivo(consultor.id, !consultor.ativo_na_roleta);
      toast.success(`Consultor ${consultor.ativo_na_roleta ? 'desativado' : 'ativado'} na roleta`);
      onRefresh();
    } catch (error) {
      toast.error("Erro ao atualizar consultor");
    }
  };

  const handleAdicionarConsultor = async () => {
    if (!novoConsultor.nome || !novoConsultor.email || !novoConsultor.natureza || !novoConsultor.cidade) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      await adicionarConsultor(novoConsultor);
      toast.success("Consultor adicionado com sucesso!");
      setOpenModal(false);
      setNovoConsultor({ nome: "", email: "", natureza: "", cidade: "" });
      onRefresh();
    } catch (error) {
      toast.error("Erro ao adicionar consultor");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverConsultor = async (consultor: Consultor) => {
    if (!confirm(`Tem certeza que deseja remover ${consultor.nome}?`)) return;

    try {
      await removerConsultor(consultor.id);
      toast.success("Consultor removido com sucesso!");
      onRefresh();
    } catch (error) {
      toast.error("Erro ao remover consultor");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Consultores</CardTitle>
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Consultor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Consultor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={novoConsultor.nome}
                  onChange={(e) => setNovoConsultor({ ...novoConsultor, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={novoConsultor.email}
                  onChange={(e) => setNovoConsultor({ ...novoConsultor, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Natureza</Label>
                <Select
                  value={novoConsultor.natureza}
                  onValueChange={(value) => setNovoConsultor({ ...novoConsultor, natureza: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a natureza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Locacao">Locação</SelectItem>
                    <SelectItem value="Captacao">Captação</SelectItem>
                    <SelectItem value="Venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select
                  value={novoConsultor.cidade}
                  onValueChange={(value) => setNovoConsultor({ ...novoConsultor, cidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {cidadesDisponiveis.map((cidade) => (
                      <SelectItem key={cidade} value={cidade}>
                        {cidade === 'Balneario Camboriu' ? 'Balneário Camboriú' : cidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={handleAdicionarConsultor} className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
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
                <TableHead>E-mail</TableHead>
                <TableHead>Fila (Natureza / Cidade)</TableHead>
                <TableHead>Ativo na Roleta?</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum consultor cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                consultores.map((consultor) => (
                  <TableRow key={consultor.id}>
                    <TableCell className="font-medium">{consultor.nome}</TableCell>
                    <TableCell>{consultor.email}</TableCell>
                    <TableCell>
                      {consultor.natureza} / {consultor.cidade}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={consultor.ativo_na_roleta}
                        onCheckedChange={() => handleToggleAtivo(consultor)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoverConsultor(consultor)}
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

export default ConsultoresTab;
