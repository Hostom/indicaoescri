import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, Trash2 } from "lucide-react";
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDENTE':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'EM ATENDIMENTO':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'NEGÓCIO FECHADO':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'CANCELADA':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

const IndicacoesTab = ({ indicacoes, onRefresh, onVerDescricao }: IndicacoesTabProps) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      <CardHeader>
        <CardTitle>Gerenciar Indicações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente / Telefone</TableHead>
                <TableHead>Corretor (Unidade)</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Consultor Atribuído</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma indicação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                indicacoes.map((indicacao) => (
                  <TableRow key={indicacao.id}>
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
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-primary">{indicacao.consultor_nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {indicacao.natureza} - {indicacao.cidade}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(indicacao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={indicacao.status}
                        onValueChange={(value) => handleStatusChange(indicacao.id, value)}
                        disabled={updating === indicacao.id}
                      >
                        <SelectTrigger className={`w-[180px] ${getStatusColor(indicacao.status)}`}>
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
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndicacoesTab;
