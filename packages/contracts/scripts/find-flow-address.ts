import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

async function main() {
  const indexerUrl = process.env.OG_STORAGE_INDEXER_URL || 'https://indexer-storage-testnet-turbo.0g.ai';
  console.log(`Querying Indexer at: ${indexerUrl}`);
  
  try {
    const response = await axios.get(`${indexerUrl}/status`);
    console.log('--- 0G Infrastructure Status ---');
    console.log(`Flow Address: ${response.data.flowAddress}`);
    console.log(`Chain ID:     ${response.data.networkIdentity?.chainId}`);
  } catch (err: any) {
    console.error(`Failed to query indexer: ${err.message}`);
  }
}

main().catch(console.error);
