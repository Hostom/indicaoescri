import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { criarIndicacao } from "@/lib/supabase-helpers";
import logoCri from "@/assets/logo-cri.png";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

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
    setResultado({ tipo: 'sucesso', mensagem: 'Processando Roleta...' });

    try {
      const { consultor } = await criarIndicacao(formData);
      setResultado({
        tipo: 'sucesso',
        mensagem: `✅ SUCESSO! Indicação atribuída para: ${consultor.nome}`
      });
      toast.success(`Indicação atribuída para ${consultor.nome}`);
      
      // Reset form
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
      setResultado({
        tipo: 'erro',
        mensagem: `❌ ERRO: ${error.message || 'Falha na conexão com o servidor.'}`
      });
      toast.error(error.message || 'Erro ao processar indicação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <img src={logoCri} alt="Logo CRI" className="h-16 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-foreground">Formulário de Indicação</CardTitle>
          <CardDescription className="text-muted-foreground">
            Preencha os campos para acionar a roleta de consultores.
          </CardDescription>
          <Link to="/dashboard" className="text-primary hover:underline text-sm mt-2 inline-block">
            Acessar Dashboard →
          </Link>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do Corretor */}
            <fieldset className="border-t pt-4">
              <legend className="text-xl font-semibold text-foreground mb-4">Dados do Corretor</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_corretor">Seu Nome:</Label>
                  <Input
                    id="nome_corretor"
                    required
                    value={formData.nome_corretor}
                    onChange={(e) => setFormData({ ...formData, nome_corretor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidade_corretor">Sua Unidade:</Label>
                  <Select
                    value={formData.unidade_corretor}
                    onValueChange={(value) => setFormData({ ...formData, unidade_corretor: value })}
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
            </fieldset>

            {/* Dados da Indicação */}
            <fieldset className="border-t pt-4">
              <legend className="text-xl font-semibold text-foreground mb-4">Dados da Indicação (para Roleta)</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="natureza">Natureza:</Label>
                  <Select
                    value={formData.natureza}
                    onValueChange={(value) => setFormData({ ...formData, natureza: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Locacao">Locação</SelectItem>
                      <SelectItem value="Captacao">Captação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade:</Label>
                  <Select
                    value={formData.cidade}
                    onValueChange={(value) => setFormData({ ...formData, cidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Balneario Camboriu">Balneário Camboriú</SelectItem>
                      <SelectItem value="Itajai">Itajaí</SelectItem>
                      <SelectItem value="Itapema">Itapema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            {/* Dados do Cliente */}
            <fieldset className="border-t pt-4">
              <legend className="text-xl font-semibold text-foreground mb-4">Dados do Cliente</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_cliente">Nome do Cliente:</Label>
                  <Input
                    id="nome_cliente"
                    required
                    value={formData.nome_cliente}
                    onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tel_cliente">Telefone:</Label>
                  <Input
                    id="tel_cliente"
                    required
                    value={formData.tel_cliente}
                    onChange={(e) => setFormData({ ...formData, tel_cliente: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao_situacao">Descrição da Situação:</Label>
                <Textarea
                  id="descricao_situacao"
                  rows={4}
                  required
                  placeholder="Ex: proprietário deseja deixar imóvel... locatário busca aluguel de 12mil..."
                  value={formData.descricao_situacao}
                  onChange={(e) => setFormData({ ...formData, descricao_situacao: e.target.value })}
                />
              </div>
            </fieldset>

            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? "Processando..." : "Enviar Indicação"}
            </Button>
          </form>

          {resultado && (
            <div className={`mt-6 p-4 rounded-md text-center ${
              resultado.tipo === 'sucesso' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-semibold">{resultado.mensagem}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
