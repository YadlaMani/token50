import { createWalletClient, http, parseEther, formatEther, isAddress, PublicClient } from 'viem'
import { avalancheFuji } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

export const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const FAT_WALLET_PRIVATE_KEY = process.env.NEXT_PUBLIC_FAT_WALLET_PRIVATE_KEY
export const FAT_WALLET_ADDRESS = process.env.NEXT_PUBLIC_FAT_WALLET_ADDRESS
export const AVAX50_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_AVAX50_TOKEN_ADDRESS
export const CLAIM_AMOUNT = parseEther(process.env.NEXT_PUBLIC_CLAIM_AMOUNT || '1')

export interface TokenBalance {
  formatted: string
  raw: bigint
}

export interface TransactionResult {
  success: boolean
  hash?: string
  error?: string
}

export class TokenService {
  private publicClient: PublicClient
  
  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient
  }

  async getTokenBalance(address: string): Promise<TokenBalance> {
    if (!AVAX50_TOKEN_ADDRESS || !isAddress(AVAX50_TOKEN_ADDRESS)) {
      throw new Error('Invalid token contract address')
    }

    if (!isAddress(address)) {
      throw new Error('Invalid wallet address')
    }

    try {
      const balance = await this.publicClient.readContract({
        address: AVAX50_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      })

      return {
        formatted: formatEther(balance),
        raw: balance
      }
    } catch (error) {
      console.error('Error fetching token balance:', error)
      throw new Error('Failed to fetch token balance')
    }
  }

  async getAvaxBalance(address: string): Promise<TokenBalance> {
    if (!isAddress(address)) {
      throw new Error('Invalid wallet address')
    }

    try {
      const balance = await this.publicClient.getBalance({
        address: address as `0x${string}`
      })

      return {
        formatted: formatEther(balance),
        raw: balance
      }
    } catch (error) {
      console.error('Error fetching AVAX balance:', error)
      throw new Error('Failed to fetch AVAX balance')
    }
  }

  async getTokenAllowance(owner: string, spender: string): Promise<TokenBalance> {
    if (!AVAX50_TOKEN_ADDRESS || !isAddress(AVAX50_TOKEN_ADDRESS)) {
      throw new Error('Invalid token contract address')
    }

    if (!isAddress(owner) || !isAddress(spender)) {
      throw new Error('Invalid wallet addresses')
    }

    try {
      const allowance = await this.publicClient.readContract({
        address: AVAX50_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [owner as `0x${string}`, spender as `0x${string}`]
      })

      return {
        formatted: formatEther(allowance),
        raw: allowance
      }
    } catch (error) {
      console.error('Error fetching token allowance:', error)
      throw new Error('Failed to fetch token allowance')
    }
  }

  validateConfig(): { isValid: boolean; error?: string } {
    if (!FAT_WALLET_PRIVATE_KEY || FAT_WALLET_PRIVATE_KEY === '0x1234567890123456789012345678901234567890123456789012345678901234') {
      return { isValid: false, error: 'Fat wallet private key not configured properly' }
    }

    if (!AVAX50_TOKEN_ADDRESS || AVAX50_TOKEN_ADDRESS === '0x1234567890123456789012345678901234567890' || !isAddress(AVAX50_TOKEN_ADDRESS)) {
      return { isValid: false, error: 'AVAX50 token contract address not configured properly' }
    }

    if (!FAT_WALLET_ADDRESS || !isAddress(FAT_WALLET_ADDRESS)) {
      return { isValid: false, error: 'Fat wallet address not configured properly' }
    }

    let formattedPrivateKey = FAT_WALLET_PRIVATE_KEY
    if (!formattedPrivateKey.startsWith('0x')) {
      formattedPrivateKey = '0x' + formattedPrivateKey
    }
    
    if (formattedPrivateKey.length !== 66) {
      return { isValid: false, error: 'Invalid private key format. Must be 64 hex characters with 0x prefix.' }
    }

    return { isValid: true }
  }

  private createFatWalletClient() {
    const validation = this.validateConfig()
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    let formattedPrivateKey = FAT_WALLET_PRIVATE_KEY!
    if (!formattedPrivateKey.startsWith('0x')) {
      formattedPrivateKey = '0x' + formattedPrivateKey
    }

    const fatWalletAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account: fatWalletAccount,
      chain: avalancheFuji,
      transport: http()
    })

    return { walletClient, account: fatWalletAccount }
  }

  async claimTokensWithPayment(userAddress: string, amount: bigint, walletClient: unknown): Promise<TransactionResult> {
    try {
      const validation = this.validateConfig()
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      if (!isAddress(userAddress)) {
        return { success: false, error: 'Invalid user address' }
      }

      const avaxPaymentAmount = (amount * parseEther('0.01')) / parseEther('1')  

      const userAvaxBalance = await this.getAvaxBalance(userAddress)
      if (userAvaxBalance.raw < avaxPaymentAmount + parseEther('0.002')) {
        return { 
          success: false, 
          error: `Insufficient AVAX balance. Need ${formatEther(avaxPaymentAmount)} AVAX + gas fees.` 
        }
      }

      const { walletClient: fatWalletClient, account } = this.createFatWalletClient()

      const fatWalletBalance = await this.getTokenBalance(account.address)
      if (fatWalletBalance.raw < amount) {
        return { success: false, error: 'Insufficient tokens in faucet' }
      }

      const avaxBalance = await this.getAvaxBalance(account.address)
      if (avaxBalance.raw < parseEther('0.001')) {
        return { success: false, error: 'Faucet wallet has insufficient AVAX for gas fees' }
      }

      const avaxTxHash = await (walletClient as { sendTransaction: (params: { to: string; value: bigint }) => Promise<`0x${string}`> }).sendTransaction({
        to: FAT_WALLET_ADDRESS as `0x${string}`,
        value: avaxPaymentAmount,
      })

      const avaxReceipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: avaxTxHash,
        timeout: 60000
      })

      if (avaxReceipt.status !== 'success') {
        return { success: false, error: 'AVAX payment failed' }
      }

      const gasEstimate = await this.publicClient.estimateContractGas({
        address: AVAX50_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [userAddress as `0x${string}`, amount],
        account
      })

      const tokenTxHash = await fatWalletClient.writeContract({
        address: AVAX50_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [userAddress as `0x${string}`, amount],
        gas: gasEstimate + BigInt(10000)  
      })

      const tokenReceipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: tokenTxHash,
        timeout: 60000
      })

      if (tokenReceipt.status === 'success') {
        return { success: true, hash: tokenTxHash }
      } else {
        return { success: false, error: 'Token transfer failed during execution' }
      }

    } catch (error: unknown) {
      console.error('Claim with payment transaction failed:', error)
      return { 
        success: false, 
        error: this.parseErrorMessage(error) 
      }
    }
  }

  async claimTokens(userAddress: string, amount: bigint = CLAIM_AMOUNT): Promise<TransactionResult> {
    try {
      const validation = this.validateConfig()
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      if (!isAddress(userAddress)) {
        return { success: false, error: 'Invalid user address' }
      }

      const { walletClient, account } = this.createFatWalletClient()

      const fatWalletBalance = await this.getTokenBalance(account.address)
      if (fatWalletBalance.raw < amount) {
        return { success: false, error: 'Insufficient tokens in faucet' }
      }

      const avaxBalance = await this.getAvaxBalance(account.address)
      if (avaxBalance.raw < parseEther('0.001')) {
        return { success: false, error: 'Faucet wallet has insufficient AVAX for gas fees' }
      }

      const gasEstimate = await this.publicClient.estimateContractGas({
        address: AVAX50_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [userAddress as `0x${string}`, amount],
        account
      })

      const hash = await walletClient.writeContract({
        address: AVAX50_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [userAddress as `0x${string}`, amount],
        gas: gasEstimate + BigInt(10000)  
      })

      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 60000
      })

      if (receipt.status === 'success') {
        return { success: true, hash }
      } else {
        return { success: false, error: 'Transaction failed during execution' }
      }

    } catch (error: unknown) {
      console.error('Claim transaction failed:', error)
      return { 
        success: false, 
        error: this.parseErrorMessage(error) 
      }
    }
  }

  async sellTokens(userAddress: string, amount: bigint): Promise<TransactionResult> {
    try {
      const validation = this.validateConfig()
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      if (!isAddress(userAddress)) {
        return { success: false, error: 'Invalid user address' }
      }

      if (amount <= 0) {
        return { success: false, error: 'Invalid amount' }
      }

      const userBalance = await this.getTokenBalance(userAddress)
      if (userBalance.raw < amount) {
        return { success: false, error: 'Insufficient token balance' }
      }

      const avaxBalance = await this.getAvaxBalance(userAddress)
      if (avaxBalance.raw < parseEther('0.001')) {
        return { success: false, error: 'Insufficient AVAX for gas fees' }
      }

      return { success: true }

    } catch (error: unknown) {
      console.error('Sell validation failed:', error)
      return { 
        success: false, 
        error: this.parseErrorMessage(error) 
      }
    }
  }

  async completeSellTransaction(userAddress: string, amount: bigint, userTransferHash: string): Promise<TransactionResult> {
    try {
      // Wait for user's token transfer to be confirmed
      const userTransferReceipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: userTransferHash as `0x${string}`,
        timeout: 60000
      })

      if (userTransferReceipt.status !== 'success') {
        return { success: false, error: 'Token transfer to fat wallet failed' }
      }

      // Calculate AVAX to send back (1 AVAX50 = 0.01 AVAX)
      const avaxToSend = (amount * parseEther('0.01')) / parseEther('1')

      const { walletClient: fatWalletClient, account } = this.createFatWalletClient()

      // Check if fat wallet has enough AVAX
      const fatWalletAvaxBalance = await this.getAvaxBalance(account.address)
      if (fatWalletAvaxBalance.raw < avaxToSend + parseEther('0.001')) {
        return { 
          success: false, 
          error: `Fat wallet has insufficient AVAX. Need ${formatEther(avaxToSend)} AVAX + gas fees.` 
        }
      }

      // Send AVAX from fat wallet to user
      const avaxTransferHash = await fatWalletClient.sendTransaction({
        to: userAddress as `0x${string}`,
        value: avaxToSend,
      })

      const avaxTransferReceipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: avaxTransferHash,
        timeout: 60000
      })

      if (avaxTransferReceipt.status === 'success') {
        return { success: true, hash: avaxTransferHash }
      } else {
        return { success: false, error: 'AVAX transfer back to user failed' }
      }

    } catch (error: unknown) {
      console.error('Complete sell transaction failed:', error)
      return { 
        success: false, 
        error: this.parseErrorMessage(error) 
      }
    }
  }

  parseErrorMessage(error: unknown): string {
    const errorObj = error as { message?: string }
    if (errorObj?.message?.includes('insufficient funds')) {
      return 'Insufficient funds for gas fees'
    } else if (errorObj?.message?.includes('execution reverted')) {
      return 'Transaction reverted - token contract may have restrictions'
    } else if (errorObj?.message?.includes('nonce')) {
      return 'Transaction nonce error - please try again'
    } else if (errorObj?.message?.includes('timeout')) {
      return 'Transaction timeout - network congestion detected'
    } else if (errorObj?.message?.includes('rejected')) {
      return 'Transaction was rejected'
    } else if (errorObj?.message) {
      return errorObj.message
    }
    return 'Unknown error occurred'
  }

  static formatBalance(balance: string): string {
    return parseFloat(balance).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    })
  }
}
