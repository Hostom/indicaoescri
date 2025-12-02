import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";
import { Consultor, toggleConsultorAtivo, adicionarConsultor, removerConsultor, UserRole } from "@/lib/supabase-helpers";
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

interface ConsultoresTabProps {
  consultores: Consultor[];
  onRefresh: () => void;
  userRole?: UserRole | null;
}

const todasCidades = ['Balneario Camboriu', 'Itajai', 'Itapema'];

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const ConsultoresTab = ({ consultores, onRefresh, userRole }: ConsultoresTabProps) => {
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [novoConsultor, setNovoConsultor] = useState({
    nome: "",
    email: "",
    natureza: "",
    cidade: ""
  });

  const cidadesDisponiveis = userRole?.tipo === 'DIRETOR' 
    ? todasCidades 
    : (userRole?.cidades || todasCidades);

  // Filtrar consultores
  const filteredConsultores = useMemo(() => {
    if (!search) return consultores;
    const searchLower = search.toLowerCase();
    return consultores.filter(
      (c) =>
        c.nome.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.cidade.toLowerCase().includes(searchLower)
    );
  }, [consultores, search]);

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
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Gerenciar Consultores
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome, email ou cidade..."
            className="w-full sm:w-64"
          />
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-success hover:bg-success/90">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Consultor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome Completo <span className="text-destructive">*</span></Label>
                  <Input
                    value={novoConsultor.nome}
                    onChange={(e) => setNovoConsultor({ ...novoConsultor, nome: e.target.value })}
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail <span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    value={novoConsultor.email}
                    onChange={(e) => setNovoConsultor({ ...novoConsultor, email: e.target.value })}
                    placeholder="consultor@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Natureza <span className="text-destructive">*</span></Label>
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
                  <Label>Cidade <span className="text-destructive">*</span></Label>
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
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAdicionarConsultor} className="flex-1 bg-success hover:bg-success/90" disabled={loading}>
                    {loading ? "Adicionando..." : "Adicionar"}
                  </Button>
                  <Button variant="outline" onClick={() => setOpenModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filteredConsultores.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "Nenhum resultado encontrado" : "Nenhum consultor cadastrado"}
            description={search ? "Tente buscar por outros termos" : "Adicione consultores para participarem da roleta de indicações"}
            action={
              !search && (
                <Button onClick={() => setOpenModal(true)} className="gap-2 bg-success hover:bg-success/90">
                  <Plus className="w-4 h-4" />
                  Adicionar Consultor
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Consultor</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Fila (Natureza / Cidade)</TableHead>
                  <TableHead>Ativo na Roleta?</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultores.map((consultor) => (
                  <TableRow key={consultor.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {getInitials(consultor.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{consultor.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{consultor.email}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {consultor.natureza} / {consultor.cidade === 'Balneario Camboriu' ? 'BC' : consultor.cidade}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={consultor.ativo_na_roleta}
                        onCheckedChange={() => handleToggleAtivo(consultor)}
                      />
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
                              Tem certeza que deseja remover <strong>{consultor.nome}</strong>? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoverConsultor(consultor)}
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

export default ConsultoresTab;
