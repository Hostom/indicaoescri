import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoCri from "@/assets/logo-cri.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Building2, User, ArrowRight, Briefcase, CheckCircle } from "lucide-react";

const Indique = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logoCri} alt="Logo CRI" className="h-10" />
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Como você deseja indicar?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha a opção que melhor representa você. Corretores CRI têm acesso exclusivo ao painel de comissões.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Corretor CRI */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Sou Corretor CRI
                  </h2>
                  <p className="text-muted-foreground">
                    Indique clientes e acompanhe suas comissões no painel exclusivo.
                  </p>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Acesso ao painel de comissões</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Visualize status de todas indicações</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Acompanhe pagamentos e valores</span>
                  </div>
                </div>

                <Link to="/painel-login" className="w-full">
                  <Button className="w-full gap-2 text-lg py-6" size="lg">
                    <User className="w-5 h-5" />
                    Acessar Painel
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card Indicação Externa */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in border-accent/20">
            <CardContent className="p-8">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Indicação Externa
                  </h2>
                  <p className="text-muted-foreground">
                    Para síndicos, zeladores ou corretores externos que desejam indicar clientes.
                  </p>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Sem necessidade de cadastro</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Indique rapidamente sem login</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Consultor é selecionado automaticamente</span>
                  </div>
                </div>

                <Link to="/externo" className="w-full">
                  <Button variant="outline" className="w-full gap-2 text-lg py-6 border-accent text-accent hover:bg-accent/10" size="lg">
                    <Building2 className="w-5 h-5" />
                    Fazer Indicação
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            Dúvidas? Entre em contato com o administrador do sistema.
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        GRUPO CRI/ADIM &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Indique;
