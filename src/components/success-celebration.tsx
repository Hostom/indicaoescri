import { useEffect, useState } from "react";
import { CheckCircle2, PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessCelebrationProps {
  isOpen: boolean;
  consultorNome: string;
  onClose: () => void;
}

export function SuccessCelebration({ isOpen, consultorNome, onClose }: SuccessCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      const colors = ["#0066CC", "#22C55E", "#EAB308", "#F97316", "#EC4899"];
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setConfetti(newConfetti);
    }
  }, [isOpen]);

  if (!isOpen || !consultorNome) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-3 h-3 rounded-sm animate-confetti"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              backgroundColor: piece.color,
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <PartyPopper className="w-5 h-5 text-warning" />
              <h2 className="text-2xl font-bold text-foreground">Indicação Enviada!</h2>
              <PartyPopper className="w-5 h-5 text-warning scale-x-[-1]" />
            </div>
            <p className="text-muted-foreground">
              A indicação foi atribuída com sucesso para:
            </p>
          </div>

          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <p className="text-xl font-bold text-primary">{consultorNome}</p>
            <p className="text-sm text-muted-foreground mt-1">
              O consultor receberá uma notificação por e-mail
            </p>
          </div>

          <Button onClick={onClose} className="w-full" size="lg">
            Fazer Nova Indicação
          </Button>
        </div>
      </div>
    </div>
  );
}
