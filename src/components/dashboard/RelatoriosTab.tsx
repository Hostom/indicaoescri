import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileDown, FileText, RotateCcw, BarChart3, FileSpreadsheet } from "lucide-react";
import { Indicacao, Consultor } from "@/lib/supabase-helpers";
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import AnalyticsCharts from "./AnalyticsCharts";

interface RelatoriosTabProps {
  indicacoes: Indicacao[];
  consultores: Consultor[];
}

const RelatoriosTab = ({ indicacoes, consultores }: RelatoriosTabProps) => {
  const [filtros, setFiltros] = useState({
    dataInicio: "", dataFim: "", consultor: "", cidade: "", natureza: "", status: ""
  });
  const [showResults, setShowResults] = useState(false);

  const cidades = useMemo(() => [...new Set(consultores.map(c => c.cidade))], [consultores]);

  const filteredIndicacoes = useMemo(() => {
    if (!showResults) return [];
    return indicacoes.filter((indicacao) => {
      const data = parseISO(indicacao.created_at);
      if (filtros.dataInicio && isBefore(data, startOfDay(parseISO(filtros.dataInicio)))) return false;
      if (filtros.dataFim && isAfter(data, endOfDay(parseISO(filtros.dataFim)))) return false;
      if (filtros.consultor && indicacao.consultor_nome !== filtros.consultor) return false;
      if (filtros.cidade && indicacao.cidade !== filtros.cidade) return false;
      if (filtros.natureza && indicacao.natureza !== filtros.natureza) return false;
      if (filtros.status && indicacao.status !== filtros.status) return false;
      return true;
    });
  }, [indicacoes, filtros, showResults]);

  const handleGerarRelatorio = () => {
    setShowResults(true);
    toast.success(`Relatório gerado com ${filteredIndicacoes.length} registros`);
  };

  const handleLimparFiltros = () => {
    setFiltros({ dataInicio: "", dataFim: "", consultor: "", cidade: "", natureza: "", status: "" });
    setShowResults(false);
  };

  const exportToCSV = () => {
    if (filteredIndicacoes.length === 0) { toast.error("Nenhum dado para exportar"); return; }
    const headers = ["Data", "Consultor", "Corretor", "Cliente", "Telefone", "Cidade", "Natureza", "Status"];
    const rows = filteredIndicacoes.map((i) => [
      format(new Date(i.created_at), "dd/MM/yyyy HH:mm"), i.consultor_nome, i.nome_corretor, i.nome_cliente, i.tel_cliente, i.cidade, i.natureza, i.status
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_indicacoes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("CSV exportado com sucesso!");
  };

  const exportToExcel = () => {
    if (filteredIndicacoes.length === 0) { toast.error("Nenhum dado para exportar"); return; }
    const data = filteredIndicacoes.map((i) => ({
      Data: format(new Date(i.created_at), "dd/MM/yyyy HH:mm"),
      Consultor: i.consultor_nome || "-",
      Corretor: i.nome_corretor,
      Cliente: i.nome_cliente,
      Telefone: i.tel_cliente,
      Cidade: i.cidade,
      Natureza: i.natureza,
      Status: i.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [{ wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 18 }];
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Indicações");
    XLSX.writeFile(wb, `relatorio_indicacoes_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Excel exportado com sucesso!");
  };

  const exportToPDF = () => {
    if (filteredIndicacoes.length === 0) { toast.error("Nenhum dado para exportar"); return; }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Indicações", 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 30);
    const headers = [["Data", "Consultor", "Corretor", "Cliente", "Cidade", "Natureza", "Status"]];
    const rows = filteredIndicacoes.map((i) => [
      format(new Date(i.created_at), "dd/MM/yyyy"), i.consultor_nome || "-", i.nome_corretor, i.nome_cliente, i.cidade, i.natureza, i.status
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 38, styles: { fontSize: 8 }, headStyles: { fillColor: [41, 128, 185] } });
    doc.save(`relatorio_indicacoes_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-warning/10 text-warning';
      case 'EM ATENDIMENTO': return 'bg-primary/10 text-primary';
      case 'NEGÓCIO FECHADO': return 'bg-success/10 text-success';
      case 'CANCELADA': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Filtros do Relatório</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Consultor</Label>
              <Select value={filtros.consultor || "all"} onValueChange={(v) => setFiltros({ ...filtros, consultor: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os consultores</SelectItem>
                  {consultores.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select value={filtros.cidade || "all"} onValueChange={(v) => setFiltros({ ...filtros, cidade: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {cidades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Natureza</Label>
              <Select value={filtros.natureza || "all"} onValueChange={(v) => setFiltros({ ...filtros, natureza: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as naturezas</SelectItem>
                  <SelectItem value="Locacao">Locação</SelectItem>
                  <SelectItem value="Captacao">Captação</SelectItem>
                  <SelectItem value="Venda">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtros.status || "all"} onValueChange={(v) => setFiltros({ ...filtros, status: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                  <SelectItem value="EM ATENDIMENTO">EM ATENDIMENTO</SelectItem>
                  <SelectItem value="NEGÓCIO FECHADO">NEGÓCIO FECHADO</SelectItem>
                  <SelectItem value="CANCELADA">CANCELADA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <Button onClick={handleGerarRelatorio}>Gerar Relatório</Button>
            <Button variant="outline" onClick={exportToCSV} disabled={filteredIndicacoes.length === 0}>
              <FileDown className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
            <Button variant="outline" onClick={exportToExcel} disabled={filteredIndicacoes.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF} disabled={filteredIndicacoes.length === 0}>
              <FileText className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
            <Button variant="secondary" onClick={handleLimparFiltros}>
              <RotateCcw className="w-4 h-4 mr-2" /> Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResults && filteredIndicacoes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Analytics</h3>
          </div>
          <AnalyticsCharts indicacoes={filteredIndicacoes} consultores={consultores} />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Resultado do Relatório</CardTitle>
          {showResults && <span className="text-sm text-muted-foreground">{filteredIndicacoes.length} registro(s)</span>}
        </CardHeader>
        <CardContent>
          {!showResults ? (
            <p className="text-center text-muted-foreground py-8">Configure os filtros e clique em "Gerar Relatório".</p>
          ) : filteredIndicacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>Consultor</TableHead><TableHead>Corretor</TableHead>
                    <TableHead>Cliente</TableHead><TableHead>Telefone</TableHead><TableHead>Cidade</TableHead>
                    <TableHead>Natureza</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIndicacoes.map((indicacao) => (
                    <TableRow key={indicacao.id}>
                      <TableCell>{format(new Date(indicacao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell className="font-medium">{indicacao.consultor_nome}</TableCell>
                      <TableCell>{indicacao.nome_corretor}</TableCell>
                      <TableCell>{indicacao.nome_cliente}</TableCell>
                      <TableCell>{indicacao.tel_cliente}</TableCell>
                      <TableCell>{indicacao.cidade}</TableCell>
                      <TableCell>{indicacao.natureza}</TableCell>
                      <TableCell><Badge className={getStatusColor(indicacao.status)}>{indicacao.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosTab;
