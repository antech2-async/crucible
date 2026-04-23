import { FetchRequest } from 'ethers';
import axios from 'axios';

// Disable global fetch to workaround undici maxRedirections bug in Node v22 / ethers v6
try {
    // @ts-ignore
    global.fetch = undefined;
} catch (e) {}

// Register Axios as the global fetcher for Ethers v6
FetchRequest.registerGetUrl(async (req) => {
    const response = await axios({
        url: req.url,
        method: req.method,
        data: req.body ? Buffer.from(req.body) : undefined,
        headers: req.headers,
        responseType: 'arraybuffer',
    });
    return {
        statusCode: response.status,
        statusMessage: response.statusText,
        headers: response.headers as any,
        body: new Uint8Array(response.data)
    };
});

import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: 'cancun', // Required for 0G Chain
    },
  },
  networks: {
    hardhat: {},
    '0g-galileo': {
      url: process.env.OG_RPC_URL || 'https://rpc.ankr.com/0g_galileo_testnet_evm',
      chainId: Number(process.env.OG_CHAIN_ID) || 16602,
      accounts: PRIVATE_KEY !== '' ? [PRIVATE_KEY] : [],
    },
    testnet: {
      url: process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai',
      chainId: 16602,
      accounts: PRIVATE_KEY !== '' ? [PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;
