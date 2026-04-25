import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Define 0G Galileo Testnet Chain
export const ogGalileo = {
  id: 16602,
  name: '0G Galileo',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Scan', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
};

export const config = createConfig({
  chains: [ogGalileo],
  connectors: [injected()],
  transports: {
    [ogGalileo.id]: http(),
  },
});
