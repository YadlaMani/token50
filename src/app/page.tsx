import { ConnectButton } from "@/components/ConnectButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <div className="flex mx-16 py-4 justify-between">
        <p>A50</p>
        <ConnectButton />
      </div>
    </div>
  );
}
