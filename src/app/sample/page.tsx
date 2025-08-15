"use client";
import client from "@/utils/client";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets/private-key";

import { defineChain } from "thirdweb/chains";
import { useAppKitAccount } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";

const contract = getContract({
  client,
  chain: defineChain(43113),
  address: "0xa8ad8ff707681F5AD60b2c9157a43F8D7e3a9243",
});
const page = () => {
  const { address, isConnected } = useAppKitAccount();

  async function SendTransaction() {
    if (!address) {
      return;
    }
    const transaction = await prepareContractCall({
      contract,
      method: "function transfer(address to, uint256 value) returns (bool)",
      params: [address, BigInt(1)],
    });
    const wallet = privateKeyToAccount({
      client,
      privateKey: process.env.NEXT_PUBLIC_PRIVATE_KEY!,
    });
    const { transactionHash } = await sendTransaction({
      transaction,
      account: wallet,
    });
    console.log("Transaction hash:", transactionHash);
  }

  return (
    <div>
      <Button onClick={SendTransaction}>Send bro</Button>
    </div>
  );
};

export default page;
