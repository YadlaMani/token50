import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    
    // Handle vendor chunks and module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
  
  // Experimental features to help with bundling
  experimental: {
    // This helps with vendor chunk issues
    esmExternals: 'loose',
  },
  
  // Transpile specific packages that might cause issues
  transpilePackages: ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
};

export default nextConfig;
