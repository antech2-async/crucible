// Disable global fetch to workaround undici maxRedirections bug in ethers v6/hardhat
// @ts-ignore
global.fetch = undefined;

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
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;
