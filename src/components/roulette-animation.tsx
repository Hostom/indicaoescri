import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface RouletteAnimationProps {
  isSpinning: boolean;
  consultorNome?: string;
  onComplete?: () => void;
}

const nomes = [
  "Ana Silva", "Carlos Santos", "Maria Oliveira", "João Costa",
  "Paula Lima", "Ricardo Souza", "Fernanda Alves", "Bruno Dias"
];

export function RouletteAnimation({ isSpinning, consultorNome, onComplete }: RouletteAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isSpinning) {
      setShowResult(false);
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % nomes.length);
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setShowResult(true);
        onComplete?.();
      }, 2000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isSpinning, onComplete]);

  if (!isSpinning && !showResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
        <div className="text-center space-y-6">
          <div className={cn(
            "mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center",
            isSpinning && !showResult && "animate-spin"
          )}>
            <Users className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              {showResult ? "Consultor selecionado" : "Sorteando consultor..."}
            </p>
            <div className="h-12 flex items-center justify-center overflow-hidden">
              <p className={cn(
                "text-2xl font-bold text-foreground transition-all duration-200",
                !showResult && "animate-pulse"
              )}>
                {showResult ? consultorNome : nomes[currentIndex]}
              </p>
            </div>
          </div>

          {!showResult && (
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
