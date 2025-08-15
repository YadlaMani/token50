import { cn } from "@/lib/utils"

type TokenInfoProps = {
  contractAddress: string
  symbol: string
  supply: number
  priceUsd: number
  marketCapUsd: number
  percentage: string
}

export default function TokenInfo({
  contractAddress,
  symbol,
  supply,
  priceUsd,
  marketCapUsd,
  percentage
}: TokenInfoProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`
    }
    return `$${num.toFixed(2)}`
  }

  const formatSupply = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`
    }
    return num.toLocaleString()
  }

  const percentageFloat = parseFloat(percentage)
  const isPositive = percentageFloat >= 0

  return (
    <div className="space-y-3">
      {/* Symbol and Price */}
      <div className="flex items-center justify-between">
        <span className="rounded-base border-2 border-border bg-main px-2 py-1 text-xs font-base text-main-foreground">
          {symbol}
        </span>
        <span className="font-heading text-sm text-foreground">
          ${priceUsd.toFixed(6)}
        </span>
      </div>

      {/* Market Stats */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-foreground/70">Market Cap:</span>
          <span className="font-base text-foreground">{formatNumber(marketCapUsd)}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-foreground/70">Supply:</span>
          <span className="font-base text-foreground">{formatSupply(supply)}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-foreground/70">24h Change:</span>
          <span className={cn(
            "font-base",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? "+" : ""}{percentage}%
          </span>
        </div>
      </div>

      {/* Contract Address */}
      <div className="border-t-2 border-border pt-2">
        <p className="text-xs text-foreground/60">
          <span className="block mb-1">Contract:</span>
          <code className="break-all font-mono">
            {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
          </code>
        </p>
      </div>
    </div>
  )
}
