import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Eye, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Indicacao, atualizarStatusIndicacao, removerIndicacao } from "@/lib/supabase-helpers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

interface IndicacoesTabProps {
  indicacoes: Indicacao[];
  onRefresh: () => Promise<void> | void;
  onVerDescricao: (descricao: string) => void;
}

const statusOptions = ['PENDENTE', 'EM ATENDIMENTO', 'NEGÓCIO FECHADO', 'CANCELADA'];
const ITEMS_PER_PAGE = 10;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDENTE':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'EM ATENDIMENTO':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'NEGÓCIO FECHADO':
      return 'bg-success/10 text-success border-success/20';
    case 'CANCELADA':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const IndicacoesTab = ({ indicacoes, onRefresh, onVerDescricao }: IndicacoesTabProps) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar indicações
  const filteredIndicacoes = useMemo(() => {
    if (!search) return indicacoes;
    const searchLower = search.toLowerCase();
    return indicacoes.filter(
      (i) =>
        i.nome_cliente.toLowerCase().includes(searchLower) ||
        i.nome_corretor.toLowerCase().includes(searchLower) ||
        i.consultor_nome?.toLowerCase().includes(searchLower) ||
        i.tel_cliente.includes(search)
    );
  }, [indicacoes, search]);

  // Paginação
  const totalPages = Math.ceil(filteredIndicacoes.length / ITEMS_PER_PAGE);
  const paginatedIndicacoes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIndicacoes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIndicacoes, currentPage]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await atualizarStatusIndicacao(id, newStatus);
      toast.success("Status atualizado!");
      onRefresh();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await removerIndicacao(id);
      toast.success("Indicação removida!");
      await onRefresh();
    } catch (error) {
      toast.error("Erro ao remover indicação");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Gerenciar Indicações
        </CardTitle>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          placeholder="Buscar por cliente, corretor ou consultor..."
          className="w-full md:w-80"
        />
      </CardHeader>
      <CardContent>
        {filteredIndicacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={search ? "Nenhum resultado encontrado" : "Nenhuma indicação"}
            description={search ? "Tente buscar por outros termos" : "As indicações aparecerão aqui quando forem criadas"}
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Cliente / Telefone</TableHead>
                    <TableHead>Corretor (Unidade)</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Consultor Atribuído</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedIndicacoes.map((indicacao) => (
                    <TableRow key={indicacao.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium">{indicacao.nome_cliente}</div>
                        <div className="text-sm text-muted-foreground">{indicacao.tel_cliente}</div>
                      </TableCell>
                      <TableCell>
                        <div>{indicacao.nome_corretor}</div>
                        <div className="text-sm text-muted-foreground">({indicacao.unidade_corretor})</div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onVerDescricao(indicacao.descricao_situacao || 'Sem descrição')}
                          className="gap-1 h-8"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-primary">{indicacao.consultor_nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {indicacao.natureza} - {indicacao.cidade}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(indicacao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={indicacao.status}
                          onValueChange={(value) => handleStatusChange(indicacao.id, value)}
                          disabled={updating === indicacao.id}
                        >
                          <SelectTrigger className={`w-[160px] h-8 text-xs font-medium border ${getStatusColor(indicacao.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deleting === indicacao.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a indicação de <strong>{indicacao.nome_cliente}</strong>? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(indicacao.id)}
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

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredIndicacoes.length)} de {filteredIndicacoes.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IndicacoesTab;
