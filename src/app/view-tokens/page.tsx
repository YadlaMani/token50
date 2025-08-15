'use client'

import { tokens } from "@/utils/tokens"
import ImageCard from '@/components/ui/image-card'
import TokenInfo from '@/components/TokenInfo'
import TokenStats from '@/components/TokenStats'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'

export default function Page() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'marketCap' | 'change'>('marketCap')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter(token =>
      token.tokenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      let aValue: number, bValue: number
      
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' 
            ? a.tokenName.localeCompare(b.tokenName)
            : b.tokenName.localeCompare(a.tokenName)
        case 'price':
          aValue = a.priceUsd
          bValue = b.priceUsd
          break
        case 'marketCap':
          aValue = a.marketCapUsd
          bValue = b.marketCapUsd
          break
        case 'change':
          aValue = parseFloat(a.percentage)
          bValue = parseFloat(b.percentage)
          break
        default:
          return 0
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [searchTerm, sortBy, sortOrder])

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-main border-b-4 border-border shadow-shadow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-heading text-4xl text-main-foreground mb-2">
            Token Universe
          </h1>
          <p className="text-main-foreground/80 text-lg">
            Discover and explore Pokemon-themed tokens
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <TokenStats />

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search tokens by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Sort Controls */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'marketCap', label: 'Market Cap' },
              { key: 'price', label: 'Price' },
              { key: 'change', label: '24h Change' },
              { key: 'name', label: 'Name' }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => handleSort(option.key as typeof sortBy)}
                className={`px-3 py-2 rounded-base border-2 border-border font-base text-sm transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                  sortBy === option.key
                    ? 'bg-main text-main-foreground shadow-shadow'
                    : 'bg-secondary-background text-foreground shadow-shadow'
                }`}
              >
                {option.label}
                {sortBy === option.key && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-foreground/70">
            Showing {filteredAndSortedTokens.length} of {tokens.length} tokens
          </p>
        </div>

        {/* Token Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredAndSortedTokens.map((token) => (
            <ImageCard
              key={token.contractAddress}
              caption={token.tokenName}
              imageUrl={token.url}
              className="transform transition-all duration-200 hover:scale-105"
            >
              <TokenInfo
                contractAddress={token.contractAddress}
                symbol={token.symbol}
                supply={token.supply}
                priceUsd={token.priceUsd}
                marketCapUsd={token.marketCapUsd}
                percentage={token.percentage}
              />
            </ImageCard>
          ))}
        </div>

        {/* No Results */}
        {filteredAndSortedTokens.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-secondary-background border-4 border-border rounded-base shadow-shadow p-8 max-w-md mx-auto">
              <h3 className="font-heading text-xl text-foreground mb-2">
                No tokens found
              </h3>
              <p className="text-foreground/70">
                Try adjusting your search terms or clear the search to see all tokens.
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-main text-main-foreground border-2 border-border rounded-base shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
