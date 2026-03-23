import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Eye, Trash2, FileText, ChevronLeft, ChevronRight, History, Filter, X, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Indicacao, Consultor, atualizarStatusIndicacao, removerIndicacao, transferirIndicacao } from "@/lib/supabase-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getSLAStatus } from "@/lib/utils";
import { format, parseISO, startOfDay, endOfDay, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import StatusHistoryModal from "./StatusHistoryModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface IndicacoesTabProps {
  indicacoes: Indicacao[];
  consultores: Consultor[];
  onRefresh: () => Promise<void> | void;
  onVerDescricao: (descricao: string) => void;
}

const statusOptions = ['PENDENTE', 'EM ATENDIMENTO', 'NEGÓCIO FECHADO', 'CANCELADA'];
const ITEMS_PER_PAGE = 10;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDENTE': return 'bg-warning/10 text-warning border-warning/20';
    case 'EM ATENDIMENTO': return 'bg-primary/10 text-primary border-primary/20';
    case 'NEGÓCIO FECHADO': return 'bg-success/10 text-success border-success/20';
    case 'CANCELADA': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const IndicacoesTab = ({ indicacoes, consultores, onRefresh, onVerDescricao }: IndicacoesTabProps) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ id: string; nome: string } | null>(null);
  const [transferModal, setTransferModal] = useState<Indicacao | null>(null);
  const [selectedConsultorId, setSelectedConsultorId] = useState("");
  const [transferring, setTransferring] = useState(false);

  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    consultor: "",
    cidade: "",
    status: "",
  });

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  const cidades = useMemo(() => {
    return [...new Set(indicacoes.map(i => i.cidade))];
  }, [indicacoes]);

  const consultorNames = useMemo(() => {
    return [...new Set(consultores.map(c => c.nome))];
  }, [consultores]);

  const filteredIndicacoes = useMemo(() => {
    let result = indicacoes;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(i =>
        i.nome_cliente.toLowerCase().includes(s) ||
        i.nome_corretor.toLowerCase().includes(s) ||
        i.consultor_nome?.toLowerCase().includes(s) ||
        i.tel_cliente.includes(search)
      );
    }

    if (filters.dataInicio) {
      const inicio = startOfDay(parseISO(filters.dataInicio));
      result = result.filter(i => !isBefore(parseISO(i.created_at), inicio));
    }
    if (filters.dataFim) {
      const fim = endOfDay(parseISO(filters.dataFim));
      result = result.filter(i => !isAfter(parseISO(i.created_at), fim));
    }
    if (filters.consultor) result = result.filter(i => i.consultor_nome === filters.consultor);
    if (filters.cidade) result = result.filter(i => i.cidade === filters.cidade);
    if (filters.status) result = result.filter(i => i.status === filters.status);

    return result;
  }, [indicacoes, search, filters]);

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
    } catch {
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
    } catch {
      toast.error("Erro ao remover indicação");
    } finally {
      setDeleting(null);
    }
  };

  const clearFilters = () => {
    setFilters({ dataInicio: "", dataFim: "", consultor: "", cidade: "", status: "" });
    setCurrentPage(1);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Gerenciar Indicações
            </CardTitle>
            <div className="flex items-center gap-2">
              <SearchInput
                value={search}
                onChange={(value) => { setSearch(value); setCurrentPage(1); }}
                placeholder="Buscar..."
                className="w-full md:w-64"
              />
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1 shrink-0"
              >
                <Filter className="w-4 h-4" />
                Filtros
                {hasActiveFilters && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">!</Badge>}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <Label className="text-xs">Data Início</Label>
                <Input type="date" value={filters.dataInicio} onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Fim</Label>
                <Input type="date" value={filters.dataFim} onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Consultor</Label>
                <Select value={filters.consultor || "all"} onValueChange={(v) => setFilters({ ...filters, consultor: v === "all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {consultorNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cidade</Label>
                <Select value={filters.cidade || "all"} onValueChange={(v) => setFilters({ ...filters, cidade: v === "all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {cidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <div className="flex gap-1">
                  <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 w-8 p-0 shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredIndicacoes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={search || hasActiveFilters ? "Nenhum resultado encontrado" : "Nenhuma indicação"}
              description={search || hasActiveFilters ? "Tente buscar por outros termos ou altere os filtros" : "As indicações aparecerão aqui quando forem criadas"}
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
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedIndicacoes.map((indicacao) => {
                      const sla = getSLAStatus(indicacao.created_at, indicacao.status);
                      return (
                        <TableRow
                          key={indicacao.id}
                          className={`hover:bg-muted/30 transition-colors ${sla === "overdue" ? "bg-destructive/5" : sla === "warning" ? "bg-warning/5" : ""}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {sla === "overdue" && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                              {sla === "warning" && <AlertTriangle className="w-4 h-4 text-warning shrink-0" />}
                              <div>
                                <div className="font-medium">{indicacao.nome_cliente}</div>
                                <div className="text-sm text-muted-foreground">{indicacao.tel_cliente}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{indicacao.nome_corretor}</div>
                            <div className="text-sm text-muted-foreground">({indicacao.unidade_corretor})</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => onVerDescricao(indicacao.descricao_situacao || 'Sem descrição')} className="gap-1 h-8">
                              <Eye className="w-4 h-4" /> Ver
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-primary">{indicacao.consultor_nome}</div>
                            <div className="text-xs text-muted-foreground">{indicacao.natureza} - {indicacao.cidade}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(indicacao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Select value={indicacao.status} onValueChange={(value) => handleStatusChange(indicacao.id, value)} disabled={updating === indicacao.id}>
                              <SelectTrigger className={`w-[160px] h-8 text-xs font-medium border ${getStatusColor(indicacao.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((status) => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => setHistoryModal({ id: indicacao.id, nome: indicacao.nome_cliente })}
                              >
                                <History className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={deleting === indicacao.id}>
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
                                    <AlertDialogAction onClick={() => handleDelete(indicacao.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredIndicacoes.length)} de {filteredIndicacoes.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <StatusHistoryModal
        indicacaoId={historyModal?.id || null}
        nomeCliente={historyModal?.nome || ""}
        onClose={() => setHistoryModal(null)}
      />
    </>
  );
};

export default IndicacoesTab;
