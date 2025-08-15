import type { Metadata } from "next";
import { headers } from 'next/headers'
import './globals.css';
import ContextProvider from '@/context'

export const metadata: Metadata = {
  title: "AVAX50 Token | Free Token Claim",
  description: "Claim your free AVAX50 tokens on Avalanche Fuji testnet. Built with Next.js, Wagmi, and modern Web3 technologies.",
  keywords: ["AVAX50", "Avalanche", "Fuji", "Token", "Claim", "Free", "Web3", "DeFi"],
  authors: [{ name: "AVAX50 Team" }],
  openGraph: {
    title: "AVAX50 Token | Free Token Claim",
    description: "Claim your free AVAX50 tokens on Avalanche Fuji testnet",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AVAX50 Token | Free Token Claim",
    description: "Claim your free AVAX50 tokens on Avalanche Fuji testnet",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}
