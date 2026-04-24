import { ethers, FetchRequest } from 'ethers';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

async function setup() {
    // @ts-ignore
    global.fetch = undefined;

    FetchRequest.registerGetUrl(async (req) => {
        console.log(`Intercepted fetch for ${req.url}`);
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
}

async function main() {
  await setup();
  const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const registryAddress = process.env.REGISTRY_ADDRESS;
  console.log(`Checking Registry at: ${registryAddress} via ${rpcUrl}`);
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const abi = [
      "function getAgentList() view returns (address[])",
      "function getAgent(address) view returns (tuple(address owner, uint256 inftTokenId, bytes32 historyRootHash, uint8 trustTier, uint256 minStakeRequired, uint256 totalTasksCompleted, uint256 totalSlashEvents, bool isActive, string[] capabilities, uint256 registrationTime, uint8 agentClass, string externalEndpoint))"
  ];
  const registry = new ethers.Contract(registryAddress || '', abi, provider);

  try {
    const agents = await registry.getAgentList();
    console.log(`Found ${agents.length} agents:`, agents);
    for (const addr of agents) {
        const data = await registry.getAgent(addr);
        console.log(`Agent ${addr}: Hash=${data.historyRootHash}`);
    }
  } catch (e) {
    console.error('Error fetching agent list:', e);
  }
}

main().catch(console.error);
