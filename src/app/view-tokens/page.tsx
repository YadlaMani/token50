import {tokens} from "@/utils/tokens";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'


export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground mx-16 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading text-foreground mb-2">Token Portfolio</h1>
        <p className="text-lg text-foreground/80">Track your top performing tokens</p>
      </div>
      
      <Table>
        <TableCaption className="text-foreground mb-4">
          A comprehensive overview of your token holdings
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead className="w-[200px]">Token</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Supply</TableHead>
            <TableHead className="text-right">Price (USD)</TableHead>
            <TableHead className="text-right">Market Cap (USD)</TableHead>
            <TableHead className="text-right">Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow key={token.contractAddress}>
              <TableCell>
                <img 
                  src={token.url} 
                  alt={token.tokenName} 
                  className="w-10 h-10 rounded-full border-2 border-border object-cover"
                />
              </TableCell>
              <TableCell className="font-heading text-base">{token.tokenName}</TableCell>
              <TableCell className="font-base uppercase tracking-wide text-foreground/80">{token.symbol}</TableCell>
              <TableCell className="font-base">{token.supply}</TableCell>
              <TableCell className="text-right font-base">${token.priceUsd}</TableCell>
              <TableCell className="text-right font-base">${token.marketCapUsd}</TableCell>
              <TableCell className="text-right">
                <span className={`font-base px-2 py-1 rounded border-2 border-border ${
                  parseFloat(token.percentage) >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {token.percentage}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
