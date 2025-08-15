'use client'

import React, { useState, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useClientMounted } from '../hooks/useClientMount'
import { Coins, Loader2 } from 'lucide-react'
import SellToken from './SellToken'
import TokenBalance from './TokenBalance'
import { FAT_WALLET_ADDRESS } from '@/lib/tokenService'
import ClaimToken from './ClaimToken'

const TokenOperations = () => {
  const mounted = useClientMounted()
  const { isConnected } = useAccount()
  const [userBalance, setUserBalance] = useState<string>('0')
  
  const balanceKey = useRef(0)
  
  const refreshBalances = () => {
    balanceKey.current += 1
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="relative">
          <div className="relative bg-background/80 backdrop-blur-sm border border-border/30 rounded-2xl p-8 flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium">Loading token operations...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="relative inline-block">
          <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-6">
            <Coins className="h-16 w-16 text-background" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          AVAX50 Token Hub
        </h1>
      </div>

      {isConnected && ( 
          <div className="flex justify-center items-center">
            <TokenBalance
              key={`user-${balanceKey.current}`}
              title="Your Balance"
              variant="user"
              onBalanceUpdate={setUserBalance}
            />
            <TokenBalance
              key={`faucet-${balanceKey.current}`}
              title="Faucet Available"
              address={FAT_WALLET_ADDRESS}
              variant="faucet"
            />
          </div>
      )}

      <div className="max-w-6xl flex justify-center items-center gap-12">
        <ClaimToken onBalanceUpdate={refreshBalances} />
        <SellToken 
          userBalance={userBalance}
          onBalanceUpdate={refreshBalances}
        />
      </div>
    </div>
  )
}

export default TokenOperations
