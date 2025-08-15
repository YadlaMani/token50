import { ConnectButton } from "@/components/ConnectButton";
import TokenOperations from "../components/TokenOperations";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center">
      

      <header className="sticky z-50 border-b border-border/20 bg-background/70 backdrop-blur-xl w-full">
        <div className="max-w-4xl w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="relative pl-16 bg-gradient-to-br from-primary/10 to-accent/10 w-12 h-12 rounded-xl flex items-center justify-center border border-border/30">
                  <span className="text-primary font-bold text-lg">A50</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  AVAX50
                </h1>
                <span className="text-sm text-muted-foreground font-medium">
                  Token Hub
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Avalanche Fuji
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <section className="pb-20 w-full mx-auto">
        <TokenOperations />
      </section>

    </div>
  );
}
