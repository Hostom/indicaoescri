import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StatusHistoryModalProps {
  indicacaoId: string | null;
  nomeCliente: string;
  onClose: () => void;
}

interface HistoricoEntry {
  id: string;
  status_anterior: string;
  status_novo: string;
  created_at: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDENTE": return "bg-warning/10 text-warning border-warning/20";
    case "EM ATENDIMENTO": return "bg-primary/10 text-primary border-primary/20";
    case "NEGÓCIO FECHADO": return "bg-success/10 text-success border-success/20";
    case "CANCELADA": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const StatusHistoryModal = ({ indicacaoId, nomeCliente, onClose }: StatusHistoryModalProps) => {
  const [historico, setHistorico] = useState<HistoricoEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!indicacaoId) return;
    setLoading(true);
    supabase
      .from("indicacao_historico" as any)
      .select("*")
      .eq("indicacao_id", indicacaoId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setHistorico((data as any as HistoricoEntry[]) || []);
        setLoading(false);
      });
  }, [indicacaoId]);

  return (
    <Dialog open={!!indicacaoId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico - {nomeCliente}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : historico.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma alteração de status registrada.
            </p>
          ) : (
            historico.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${getStatusColor(entry.status_anterior)}`}>
                      {entry.status_anterior}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Badge className={`text-xs ${getStatusColor(entry.status_novo)}`}>
                      {entry.status_novo}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusHistoryModal;
