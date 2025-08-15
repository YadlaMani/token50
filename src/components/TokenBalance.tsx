'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, RefreshCw, Copy } from 'lucide-react'
import { TokenService } from '@/lib/tokenService'
import { useClientMounted } from '@/hooks/useClientMount'

interface TokenBalanceProps {
  title: string
  address?: string
  icon?: React.ReactNode
  variant?: 'user' | 'faucet'
  onBalanceUpdate?: (balance: string) => void
}

const TokenBalance: React.FC<TokenBalanceProps> = ({ 
  title, 
  address, 
  icon,
  variant = 'user',
  onBalanceUpdate 
}) => {
  const { address: userAddress } = useAccount()
  const publicClient = usePublicClient()
  const mounted = useClientMounted()
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)

  const targetAddress = address || userAddress
  const defaultIcon = variant === 'user' ? 
    <Wallet className="h-5 w-5 text-primary" /> : 
    <TrendingUp className="h-5 w-5 text-primary" />

  const fetchBalance = useCallback(async () => {
    if (!targetAddress || !publicClient || !mounted) return

    setIsLoading(true)
    try {
      const tokenService = new TokenService(publicClient)
      const tokenBalance = await tokenService.getTokenBalance(targetAddress)
      setBalance(tokenBalance.formatted)
      onBalanceUpdate?.(tokenBalance.formatted)
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance('0')
    } finally {
      setIsLoading(false)
    }
  }, [targetAddress, publicClient, mounted, onBalanceUpdate])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const formatBalance = (balance: string) => {
    return TokenService.formatBalance(balance)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!mounted) {
    return (
      <div className="relative group h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-primary/5 rounded-lg blur-sm"></div>
        <div className="relative bg-background/80 border border-border/30 rounded-lg p-6 h-full backdrop-blur-sm animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-muted rounded w-20"></div>
            <div className="w-10 h-10 rounded-full bg-muted"></div>
          </div>
          <div className="h-8 bg-muted rounded w-24 mb-2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group h-full">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-primary/5 rounded-lg blur-sm group-hover:blur transition-all duration-300"></div>
      <div className="relative bg-background/80 border border-border/30 rounded-lg p-6 h-full backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-background/80 border border-border/30 flex items-center justify-center">
              {icon || defaultIcon}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={fetchBalance}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold">{formatBalance(balance)}</span>
          <Badge variant="secondary" className="text-xs">AVAX50</Badge>
        </div>
        {targetAddress && variant === 'user' && (
          <div className="flex items-center gap-2 mt-3">
            <code className="text-xs bg-background/60 px-2 py-1 rounded border border-border/30 text-muted-foreground">
              {targetAddress.slice(0, 6)}...{targetAddress.slice(-4)}
            </code>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(targetAddress)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TokenBalance
