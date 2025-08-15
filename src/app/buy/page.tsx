"use client";
import { useEffect, useState } from "react";
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetworkCore,
  type Provider,
} from "@reown/appkit/react";
import { pay } from "@reown/appkit-pay";
import { BrowserProvider, formatEther } from "ethers";
import axios from "axios";
import tokens from "@/utils/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import client from "@/utils/client";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets/private-key";
import { defineChain } from "thirdweb/chains";

const Page = () => {
  const { isConnected, address } = useAppKitAccount();
  const [balance, setBalance] = useState(0);
  const [avaxPrice, setAvaxPrice] = useState(0);
  const [usdAmount, setUsdAmount] = useState(0);
  const [avaxAmount, setAvaxAmount] = useState(0);
  const { walletProvider } = useAppKitProvider<Provider>("eip155");
  const { chainId } = useAppKitNetworkCore();
  const [isLoading, setIsLoading] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [transferredTokens, setTransferredTokens] = useState<string[]>([]);
  const [failedTokens, setFailedTokens] = useState<string[]>([]);

  async function fetchAvaxPrice() {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/coins/avalanche-2",
        {
          headers: {
            x_cg_demo_api_key: process.env.NEXT_PUBLIC_GECKO_KEY,
          },
        }
      );
      setAvaxPrice(res.data.market_data.current_price.usd);
    } catch (err) {
      toast.error("Error fetching AVAX price, try again later");
    }
  }
  async function fetchAccountBalance() {
    if (!address) return;
    try {
      console.log(address);
      console.log(chainId);
      console.log(tokens.length);
      const provider = new BrowserProvider(walletProvider, chainId);
      console.log(address);
      const balance = await provider.getBalance(address);
      const eth = formatEther(balance);
      setBalance(Number.parseFloat(eth));
    } catch (err) {
      console.log(err);
    }
  }
  async function buyBasket() {
    if (!address) return;
    setIsLoading(true);
    setTransferProgress(0);
    setCurrentTokenIndex(0);
    setTransferredTokens([]);
    setFailedTokens([]);

    try {
      const payment = await pay({
        recipient: process.env.NEXT_PUBLIC_FAT_WALLLET_ADDRESS!,
        amount: avaxAmount,
        paymentAsset: {
          network: "eip155:43113",
          asset: "native",
          metadata: {
            name: "Avalanche Fuji",
            symbol: "AVAX",
            decimals: 18,
          },
        },
      });

      if (!payment.success) throw new Error("AVAX payment failed");

      const wallet = privateKeyToAccount({
        client,
        privateKey: process.env.NEXT_PUBLIC_PRIVATE_KEY!,
      });

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        setCurrentTokenIndex(i);

        try {
          const contract = getContract({
            client,
            chain: defineChain(43113),
            address: token.contractAddress,
          });

          const tokenAmount = BigInt(
            Math.floor(
              ((usdAmount * Number.parseFloat(token.percentage)) /
                100 /
                token.priceUsd) *
                1e18
            )
          );

          const transaction = await prepareContractCall({
            contract,
            method:
              "function transfer(address to, uint256 value) returns (bool)",
            params: [address, tokenAmount],
          });

          const { transactionHash } = await sendTransaction({
            transaction,
            account: wallet,
          });

          await new Promise((r) => setTimeout(r, 2000));

          setTransferredTokens((prev) => [...prev, token.symbol]);
          const progress = ((i + 1) / tokens.length) * 100;
          setTransferProgress(progress);

          console.log(`✅ Transferred ${token.symbol}: ${transactionHash}`);
        } catch (err) {
          console.error(`❌ Failed to transfer ${token.symbol}:`, err);
          setFailedTokens((prev) => [...prev, token.symbol]);
          toast.error(`Failed to transfer ${token.symbol}, continuing...`);

          const progress = ((i + 1) / tokens.length) * 100;
          setTransferProgress(progress);
        }
      }

      toast.success("Basket purchase process completed!");
    } catch (err) {
      console.log(err);
      toast.error("Error buying basket");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAvaxPrice();
  }, []);
  useEffect(() => {
    fetchAccountBalance();
  }, [address, walletProvider]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Token50 Basket</CardTitle>
            <CardDescription>
              Exchange AVAX for a diversified basket of 50 tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="avax-input" className="text-sm font-medium">
                  AVAX Amount
                </label>
                <Input
                  id="avax-input"
                  placeholder="Enter AVAX amount"
                  min={0}
                  type="number"
                  max={balance}
                  onChange={(e) => {
                    const value = Number.parseFloat(e.target.value);
                    setAvaxAmount(value);
                    setUsdAmount(value * avaxPrice);
                  }}
                  value={avaxAmount}
                  className="text-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">USD Value</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${usdAmount.toFixed(2)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Available Balance
                  </div>
                  <div className="text-2xl font-bold">
                    {balance.toFixed(4)} AVAX
                  </div>
                </Card>
              </div>
            </div>

            <Separator />

            {isLoading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Transfer Progress</span>
                    <span>{Math.round(transferProgress)}%</span>
                  </div>
                  <Progress value={transferProgress} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    Processing token {currentTokenIndex + 1} of {tokens.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">
                      Successful
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {transferredTokens.length}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {transferredTokens.slice(-5).map((token) => (
                        <Badge
                          key={token}
                          variant="secondary"
                          className="text-xs"
                        >
                          {token}
                        </Badge>
                      ))}
                      {transferredTokens.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{transferredTokens.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Failed</div>
                    <div className="text-xl font-bold text-red-600">
                      {failedTokens.length}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {failedTokens.slice(-5).map((token) => (
                        <Badge
                          key={token}
                          variant="destructive"
                          className="text-xs"
                        >
                          {token}
                        </Badge>
                      ))}
                      {failedTokens.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{failedTokens.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            <Button
              onClick={buyBasket}
              disabled={
                !isConnected ||
                isLoading ||
                avaxAmount <= 0 ||
                avaxAmount > balance
              }
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Transfer...
                </div>
              ) : (
                "Buy Token Basket"
              )}
            </Button>

            {!isConnected && (
              <div className="text-center text-sm text-muted-foreground">
                Please connect your wallet to continue
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
