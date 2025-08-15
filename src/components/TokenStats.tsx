import { tokens } from "@/utils/tokens"

export default function TokenStats() {
  const totalMarketCap = tokens.reduce((sum, token) => sum + token.marketCapUsd, 0)
  const averagePrice = tokens.reduce((sum, token) => sum + token.priceUsd, 0) / tokens.length
  const topGainer = tokens.reduce((max, token) => 
    parseFloat(token.percentage) > parseFloat(max.percentage) ? token : max
  )
  const topLoser = tokens.reduce((min, token) => 
    parseFloat(token.percentage) < parseFloat(min.percentage) ? token : min
  )

  const formatMarketCap = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`
    }
    return `$${(num / 1000).toFixed(2)}K`
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="brutalism-card p-4 text-center">
        <h3 className="font-heading text-sm text-foreground/70 mb-1">Total Market Cap</h3>
        <p className="font-heading text-lg text-foreground">{formatMarketCap(totalMarketCap)}</p>
      </div>
      
      <div className="brutalism-card p-4 text-center">
        <h3 className="font-heading text-sm text-foreground/70 mb-1">Average Price</h3>
        <p className="font-heading text-lg text-foreground">${averagePrice.toFixed(4)}</p>
      </div>
      
      <div className="brutalism-card p-4 text-center">
        <h3 className="font-heading text-sm text-foreground/70 mb-1">Top Gainer</h3>
        <p className="font-base text-sm text-foreground line-clamp-1">{topGainer.tokenName}</p>
        <p className="font-heading text-sm text-green-600">+{topGainer.percentage}%</p>
      </div>
      
      <div className="brutalism-card p-4 text-center">
        <h3 className="font-heading text-sm text-foreground/70 mb-1">Biggest Drop</h3>
        <p className="font-base text-sm text-foreground line-clamp-1">{topLoser.tokenName}</p>
        <p className="font-heading text-sm text-red-600">{topLoser.percentage}%</p>
      </div>
    </div>
  )
}
