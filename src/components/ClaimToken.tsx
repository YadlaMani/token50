'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseEther } from 'viem'
import { useClientMounted } from '../hooks/useClientMount'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Copy, ExternalLink, Zap } from 'lucide-react'
import { TokenService, FAT_WALLET_ADDRESS, AVAX50_TOKEN_ADDRESS } from '@/lib/tokenService'

const DEFAULT_CLAIM_AMOUNT = process.env.NEXT_PUBLIC_CLAIM_AMOUNT || '1'

const ClaimToken = ({ onBalanceUpdate }: { onBalanceUpdate?: () => void }) => {
  const { address: userAddress, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const mounted = useClientMounted()
  const [isLoading, setIsLoading] = useState(false)
  const [claimStatus, setClaimStatus] = useState<string>('')
  const [userAvaxBalance, setUserAvaxBalance] = useState<string>('0')
  const [fatWalletBalance, setFatWalletBalance] = useState<string>('0')
  const [progressValue, setProgressValue] = useState(0)
  const [txHash, setTxHash] = useState<string>('')
  const [claimAmount, setClaimAmount] = useState<string>(DEFAULT_CLAIM_AMOUNT)

  const tokenService = useMemo(() => {
    return publicClient ? new TokenService(publicClient) : null
  }, [publicClient])

  const checkUserBalance = useCallback(async () => {
    if (!isConnected || !userAddress || !tokenService) return

    try {
      const avaxBalance = await tokenService.getAvaxBalance(userAddress)
      setUserAvaxBalance(avaxBalance.formatted)
    } catch (error) {
      console.error('Error checking user balance:', error)
    }
  }, [isConnected, userAddress, tokenService])

  const checkFatWalletBalance = useCallback(async () => {
    if (!tokenService || !FAT_WALLET_ADDRESS) return

    try {
      const balance = await tokenService.getTokenBalance(FAT_WALLET_ADDRESS)
      setFatWalletBalance(balance.formatted)
    } catch (error) {
      console.error('Error checking fat wallet balance:', error)
    }
  }, [tokenService])

  useEffect(() => {
    if (mounted) {
      checkUserBalance()
      checkFatWalletBalance()
    }
  }, [mounted, isConnected, userAddress, publicClient, checkFatWalletBalance, checkUserBalance])

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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="relative">
          <div className="relative bg-background/80 backdrop-blur-sm border border-border/30 rounded-2xl p-8 flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium">Initializing faucet...</span>
          </div>
        </div>
      </div>
    )
  }

  const handleClaim = async () => {
    if (!isConnected || !userAddress || !walletClient || !tokenService) {
      setClaimStatus('Please connect your wallet first')
      return
    }

    const amountNumber = parseFloat(claimAmount)
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setClaimStatus('Please enter a valid amount greater than 0')
      return
    }

    if (amountNumber > parseFloat(fatWalletBalance)) {
      setClaimStatus(`Insufficient tokens in faucet. Maximum available: ${TokenService.formatBalance(fatWalletBalance)} AVAX50`)
      return
    }

    const claimAmountWei = parseEther(claimAmount)

    if (parseFloat(userAvaxBalance) < (amountNumber * 0.01 + 0.002)) {
      setClaimStatus(`Insufficient AVAX balance. You need ${(amountNumber * 0.01 + 0.002).toFixed(4)} AVAX for this transaction.`)
      return
    }

    setIsLoading(true)
    setClaimStatus('Initializing claim with payment...')
    setProgressValue(10)

    try {
      const configValidation = tokenService.validateConfig()
      if (!configValidation.isValid) {
        setClaimStatus(configValidation.error || 'Configuration validation failed')
        setIsLoading(false)
        return
      }

      setProgressValue(30)
      setClaimStatus('Processing claim with payment...')

      const claimResult = await tokenService.claimTokensWithPayment(userAddress, claimAmountWei, walletClient)

      if (claimResult.success) {
        setTxHash(claimResult.hash || '')
        setProgressValue(100)
        setClaimStatus(`Claim successful! Paid ${(amountNumber * 0.01).toFixed(4)} AVAX and received ${claimAmount} AVAX50 tokens.`)
        
        setTimeout(async () => {
          await checkUserBalance()
          await checkFatWalletBalance()
          onBalanceUpdate?.()  
        }, 2000)
      } else {
        setClaimStatus(`Claim failed: ${claimResult.error}`)
      }

    } catch (error: unknown) {
      console.error('Claim failed:', error)
      setClaimStatus(`Claim failed: ${tokenService.parseErrorMessage(error)}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setProgressValue(0), 3000)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const setMaxAmount = () => {
    const maxAvailable = parseFloat(fatWalletBalance)
    if (maxAvailable > 0) {
      setClaimAmount(maxAvailable.toString())
    }
  }

  const isClaimDisabled = !isConnected || 
                        isLoading || 
                        parseFloat(fatWalletBalance) < parseFloat(claimAmount) || 
                        parseFloat(claimAmount) <= 0 || 
                        isNaN(parseFloat(claimAmount)) ||
                        parseFloat(userAvaxBalance) < (parseFloat(claimAmount || '0') * 0.01 + 0.002) 

  return (
    <div className="flex justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <Card>
          
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="claimAmount" className="text-sm font-medium">
                Amount to Claim (AVAX50 Tokens)
              </Label>
              <div className="relative flex gap-2">
                <Input
                  id="claimAmount"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="pr-20 flex-1"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-20 flex items-center pr-3">
                  <span className="text-sm text-muted-foreground font-medium">AVAX50</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setMaxAmount}
                  disabled={isLoading || parseFloat(fatWalletBalance) === 0}
                  className="h-10 px-3"
                >
                  Max
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Available in faucet: {TokenService.formatBalance(fatWalletBalance)} AVAX50
                </p>
                <p className="text-xs text-muted-foreground">
                  Your AVAX balance: {TokenService.formatBalance(userAvaxBalance)} AVAX
                </p>
                {parseFloat(claimAmount) > 0 && (
                  <div className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-800">
                    <div className="font-medium">Payment Required:</div>
                    <div>• AVAX Cost: {(parseFloat(claimAmount) * 0.01).toFixed(4)} AVAX</div>
                    <div>• You will receive: {claimAmount} AVAX50 tokens</div>
                    <div className="text-xs opacity-80 mt-1">0.01 AVAX per token + gas fees</div>
                  </div>
                )}
                {parseFloat(claimAmount) > 0 && parseFloat(userAvaxBalance) < (parseFloat(claimAmount) * 0.01 + 0.002) && (
                  <div className="text-xs bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 px-3 py-2 rounded-md border border-red-200 dark:border-red-800">
                    <div className="font-medium">⚠️ Insufficient AVAX Balance</div>
                    <div>You need at least {((parseFloat(claimAmount) * 0.01) + 0.002).toFixed(4)} AVAX for this transaction</div>
                  </div>
                )}
              </div>
            </div>
        

            {isLoading && (
              <div className="relative mt-6">
                <div className="relative bg-background/90 border border-primary/20 rounded-lg p-6 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-primary">{claimStatus}</span>
                    <span className="text-sm font-mono text-primary">{Math.round(progressValue)}%</span>
                  </div>
                  <Progress 
                    value={progressValue} 
                    className="h-3 bg-secondary" 
                  />
                </div>
              </div>
            )}
            
            {parseFloat(fatWalletBalance) < parseFloat(claimAmount) && FAT_WALLET_ADDRESS && AVAX50_TOKEN_ADDRESS && parseFloat(claimAmount) > 0 && (
              <div className="relative mt-6">
                <Alert className="relative border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <strong>Insufficient Faucet Balance:</strong> The faucet only has {TokenService.formatBalance(fatWalletBalance)} AVAX50 tokens available. Please enter a smaller amount.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {parseFloat(fatWalletBalance) === 0 && FAT_WALLET_ADDRESS && AVAX50_TOKEN_ADDRESS && (
              <div className="relative mt-6">
                <Alert className="relative border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <strong>Temporarily Unavailable:</strong> The faucet is currently out of tokens. Please check back later.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {claimStatus && !isLoading && (
              <div className="relative mt-6">
                <Alert className="relative border border-border/30 bg-background/80 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <AlertDescription className="break-words">
                    {claimStatus}
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
            
            <div className="relative w-full">
              <Button 
                onClick={handleClaim}
                disabled={isClaimDisabled}
                size="lg"
                className="relative w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Processing Claim...
                  </>
                ) : (
                  <>
                    <Zap className="mr-3 h-6 w-6" />
                    Pay {(parseFloat(claimAmount || '0') * 0.01).toFixed(4)} AVAX & Claim {claimAmount} AVAX50
                  </>
                )}
              </Button>
            </div>
            
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default ClaimToken