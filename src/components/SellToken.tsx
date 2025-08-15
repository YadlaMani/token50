'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseEther } from 'viem'
import { useClientMounted } from '../hooks/useClientMount'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {Loader2, ExternalLink, Copy, DollarSign, AlertCircle, Shield, Wallet } from 'lucide-react'
import { TokenService, ERC20_ABI, FAT_WALLET_ADDRESS, AVAX50_TOKEN_ADDRESS } from '@/lib/tokenService'

interface SellTokenProps {
  userBalance?: string
  onBalanceUpdate?: () => void
}

const SellToken: React.FC<SellTokenProps> = ({
  userBalance: propUserBalance,
  onBalanceUpdate
}) => {
  const { address: userAddress, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const mounted = useClientMounted()
  
  const [sellAmount, setSellAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [sellStatus, setSellStatus] = useState<string>('')
  const [progressValue, setProgressValue] = useState(0)
  const [txHash, setTxHash] = useState<string>('')
  
  const userBalance = propUserBalance || '0'

  const tokenService = publicClient ? new TokenService(publicClient) : null

  const hasValidBalance = userBalance && parseFloat(userBalance) > 0

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgressValue((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setProgressValue(0)
    }
  }, [isLoading])

  useEffect(() => {
    if (mounted && isConnected) {
    }
  }, [mounted, isConnected, userAddress, sellAmount])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="relative bg-background/80 backdrop-blur-sm border border-border/30 rounded-2xl p-8 flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium">Loading sell interface...</span>
          </div>
        </div>
      </div>
    )
  }

  const handleSellAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSellAmount(value)
      setSellStatus('')
    }
  }

  const validateSellAmount = (): { isValid: boolean; error?: string } => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      return { isValid: false, error: 'Please enter a valid amount' }
    }

    if (parseFloat(sellAmount) > parseFloat(userBalance)) {
      return { isValid: false, error: 'Insufficient token balance' }
    }

    return { isValid: true }
  }

  const handleSell = async () => {
    if (!isConnected || !userAddress || !walletClient) {
      setSellStatus('Please connect your wallet first')
      return
    }

    const validation = validateSellAmount()
    if (!validation.isValid) {
      setSellStatus(validation.error || 'Invalid amount')
      return
    }

    if (!tokenService) {
      setSellStatus('Token service not available')
      return
    }

    setIsLoading(true)
    setSellStatus('Initializing sale...')
    setProgressValue(10)

    try {
      const sellAmountBigInt = parseEther(sellAmount)

      setProgressValue(20)
      setSellStatus('Validating transaction...')

      // Validate the sell transaction
      const sellValidation = await tokenService.sellTokens(userAddress, sellAmountBigInt)
      if (!sellValidation.success) {
        setSellStatus(sellValidation.error || 'Validation failed')
        setIsLoading(false)
        return
      }

      setProgressValue(30)
      setSellStatus('Calculating AVAX return amount...')
      
      // Calculate how much AVAX user will receive (1 AVAX50 = 0.01 AVAX)
      const avaxToReceiveFormatted = (parseFloat(sellAmount) * 0.01).toFixed(4)

      setProgressValue(40)
      setSellStatus(`You will receive ${avaxToReceiveFormatted} AVAX. Estimating gas...`)

      const gasEstimate = await publicClient?.estimateContractGas({
        address: AVAX50_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [FAT_WALLET_ADDRESS as `0x${string}`, sellAmountBigInt],
        account: userAddress
      })

      setProgressValue(60)
      setSellStatus('Executing token transfer to fat wallet...')

      // First: User transfers tokens to fat wallet
      const tokenTransferHash = await walletClient.writeContract({
        address: AVAX50_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [FAT_WALLET_ADDRESS as `0x${string}`, sellAmountBigInt],
        gas: gasEstimate ? gasEstimate + BigInt(10000) : undefined
      })

      setTxHash(tokenTransferHash)
      setProgressValue(75)
      setSellStatus('Processing AVAX transfer from fat wallet...')
      
      // Second: Fat wallet sends AVAX back to user
      const avaxTransferResult = await tokenService.completeSellTransaction(
        userAddress, 
        sellAmountBigInt, 
        tokenTransferHash
      )

      if (!avaxTransferResult.success) {
        setSellStatus(`Token transfer successful but AVAX return failed: ${avaxTransferResult.error}`)
        setIsLoading(false)
        return
      }

      setProgressValue(100)
      setSellStatus(`Sale completed! Sold ${sellAmount} AVAX50 tokens and received ${avaxToReceiveFormatted} AVAX.`)
      setSellAmount('')
      
      setTimeout(() => {
        onBalanceUpdate?.()
      }, 2000)

    } catch (error: unknown) {
      console.error('Sell failed:', error)
      setSellStatus(`Sale failed: ${tokenService.parseErrorMessage(error)}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setProgressValue(0), 3000)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const maxSellAmount = () => {
    setSellAmount(userBalance)
  }

  const isSellDisabled = !isConnected || isLoading || !sellAmount || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > parseFloat(userBalance) || !hasValidBalance

  const getDisabledReason = () => {
    if (!isConnected) return "Please connect your wallet"
    if (!hasValidBalance) return "No tokens available to sell"
    if (!sellAmount || parseFloat(sellAmount) <= 0) return "Enter an amount to sell"
    if (parseFloat(sellAmount) > parseFloat(userBalance)) return "Amount exceeds available balance"
    if (isLoading) return "Transaction in progress"
    return ""
  }

  return (
    <div className="flex justify-center px-4 py-6">
      <div className="w-full max-w-2xl">
        

        <Card>
          <CardContent className="space-y-6">
            {!isConnected && (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Connect Your Wallet</p>
                  <p className="text-sm">Connect your wallet to sell AVAX50 tokens</p>
                </div>
              </div>
            )}

                {isConnected && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sellAmount" className="text-base font-medium">Amount to Sell</Label>
                      <div className="relative">
                        <Input
                          id="sellAmount"
                          type="text"
                          placeholder="0.0"
                          value={sellAmount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSellAmountChange(e.target.value)}
                          className="pr-20 h-12 text-lg"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 text-sm font-medium"
                          onClick={maxSellAmount}
                        >
                          MAX
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Available: {TokenService.formatBalance(userBalance)} AVAX50
                        {!hasValidBalance && (
                          <span className="text-orange-600 ml-2">
                            (Connect wallet and claim tokens first)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Show expected AVAX return */}
                    {sellAmount && parseFloat(sellAmount) > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4 border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">You will receive:</span>
                          <span className="text-lg font-semibold text-green-600">
                            {(parseFloat(sellAmount) * 0.01).toFixed(4)} AVAX
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Exchange rate: 1 AVAX50 = 0.01 AVAX
                        </div>
                      </div>
                    )}
                  </div>
                )}             
            {isLoading && (
              <div className="relative mt-6">
                <div className="relative bg-background/90 border border-primary/20 rounded-lg p-6 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-primary">{sellStatus}</span>
                    <span className="text-sm font-mono text-primary">{Math.round(progressValue)}%</span>
                  </div>
                  <Progress 
                    value={progressValue} 
                    className="h-3 bg-secondary" 
                  />
                </div>
              </div>
            )}
            
            {sellStatus && !isLoading && (
              <div className="relative mt-6">
                <Alert className="relative border border-border/30 bg-background/80 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <AlertDescription className="break-words">
                    {sellStatus}
                    {txHash && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => window.open(`https://testnet.snowtrace.io/tx/${txHash}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          View on Explorer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          onClick={() => copyToClipboard(txHash)}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Copy TX
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col pt-6">
            <Separator className="mb-6" />
            
            <div className="w-full space-y-3">
              {isSellDisabled && !isLoading && (
                <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                  {getDisabledReason()}
                </div>
              )}
              
              <div className="relative w-full">
                <Button 
                  onClick={handleSell}
                  disabled={isSellDisabled}
                  size="lg"
                  className="relative w-full h-14 text-lg font-semibold bg-gradient-to-r from-destructive to-orange-500 hover:from-destructive/90 hover:to-orange-500/90 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Processing Sale...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-3 h-6 w-6" />
                      {sellAmount && parseFloat(sellAmount) > 0 
                        ? `Sell ${sellAmount} AVAX50 for ${(parseFloat(sellAmount) * 0.01).toFixed(4)} AVAX`
                        : 'Sell AVAX50 Tokens'
                      }
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="mt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>Secure token transfers powered by Avalanche Fuji Testnet</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default SellToken
