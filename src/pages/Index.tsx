import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { criarIndicacao } from "@/lib/supabase-helpers";
import { formatPhone } from "@/lib/utils";
import logoCri from "@/assets/logo-cri.png";
import { RouletteAnimation } from "@/components/roulette-animation";
import { SuccessCelebration } from "@/components/success-celebration";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, MapPin, Phone, FileText, Send, LayoutDashboard } from "lucide-react";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [consultorSelecionado, setConsultorSelecionado] = useState("");

  const [formData, setFormData] = useState({
    nome_corretor: "",
    unidade_corretor: "",
    natureza: "Locacao",
    cidade: "Balneario Camboriu",
    nome_cliente: "",
    tel_cliente: "",
    descricao_situacao: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { consultor } = await criarIndicacao(formData);
      
      if (!consultor || !consultor.nome) {
        throw new Error('Consultor selecionado não possui nome válido');
      }
      
      setConsultorSelecionado(consultor.nome);
      setShowRoulette(true);
      
      setTimeout(() => {
        setShowRoulette(false);
        setShowSuccess(true);
        toast.success(`Indicação atribuída para ${consultor.nome}`);
      }, 2500);
      
      setFormData({
        nome_corretor: "",
        unidade_corretor: "",
        natureza: "Locacao",
        cidade: "Balneario Camboriu",
        nome_cliente: "",
        tel_cliente: "",
        descricao_situacao: "",
      });
    } catch (error: any) {
      setShowRoulette(false);
      setConsultorSelecionado("");
      toast.error(error.message || 'Erro ao processar indicação');
      setLoading(false);
    }
  };

  const handleCloseSuccess = useCallback(() => {
    setShowSuccess(false);
    setConsultorSelecionado("");
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logoCri} alt="Logo CRI" className="h-10" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Formulário de Indicação
          </h1>
          <p className="text-muted-foreground">
            Preencha os campos para acionar a roleta de consultores
          </p>
        </div>

        <Card className="shadow-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Dados do Corretor */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-lg text-foreground">Dados do Corretor</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_corretor" className="flex items-center gap-1">
                      Seu Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome_corretor"
                      required
                      placeholder="Digite seu nome"
                      value={formData.nome_corretor}
                      onChange={(e) => setFormData({ ...formData, nome_corretor: e.target.value })}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidade_corretor" className="flex items-center gap-1">
                      Sua Unidade <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.unidade_corretor}
                      onValueChange={(value) => setFormData({ ...formData, unidade_corretor: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRI Brava">CRI Brava</SelectItem>
                        <SelectItem value="BC">BC</SelectItem>
                        <SelectItem value="Itapema">Itapema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dados da Indicação */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <MapPin className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="font-semibold text-lg text-foreground">Dados da Indicação</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="natureza">Natureza</Label>
                    <Select
                      value={formData.natureza}
                      onValueChange={(value) => setFormData({ ...formData, natureza: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Locacao">Locação</SelectItem>
                        <SelectItem value="Captacao">Captação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Select
                      value={formData.cidade}
                      onValueChange={(value) => setFormData({ ...formData, cidade: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Balneario Camboriu">Balneário Camboriú</SelectItem>
                        <SelectItem value="Itajai">Itajaí</SelectItem>
                        <SelectItem value="Itapema">Itapema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Phone className="w-4 h-4 text-warning" />
                  </div>
                  <h2 className="font-semibold text-lg text-foreground">Dados do Cliente</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_cliente" className="flex items-center gap-1">
                      Nome do Cliente <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome_cliente"
                      required
                      placeholder="Nome completo do cliente"
                      value={formData.nome_cliente}
                      onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tel_cliente" className="flex items-center gap-1">
                      Telefone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tel_cliente"
                      required
                      placeholder="(00) 00000-0000"
                      value={formData.tel_cliente}
                      onChange={(e) => setFormData({ ...formData, tel_cliente: formatPhone(e.target.value) })}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                      maxLength={15}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao_situacao" className="flex items-center gap-1">
                    <FileText className="w-4 h-4 mr-1" />
                    Descrição da Situação <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="descricao_situacao"
                    rows={4}
                    required
                    placeholder="Ex: proprietário deseja deixar imóvel... locatário busca aluguel de 12mil..."
                    value={formData.descricao_situacao}
                    onChange={(e) => setFormData({ ...formData, descricao_situacao: e.target.value })}
                    className="transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full text-lg py-6 gap-2 hover-lift" 
                disabled={loading}
                size="lg"
              >
                <Send className="w-5 h-5" />
                {loading ? "Processando..." : "Enviar Indicação"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Ao enviar, um consultor será selecionado automaticamente pela roleta
        </p>
      </main>

      <RouletteAnimation isSpinning={showRoulette} consultorNome={consultorSelecionado} />
      <SuccessCelebration isOpen={showSuccess} consultorNome={consultorSelecionado} onClose={handleCloseSuccess} />
    </div>
  );
};

export default Index;
