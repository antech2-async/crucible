import { ethers, FetchRequest } from 'ethers';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

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

async function checkBalances() {
    const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const wallets = [
        { name: 'Deployer (.env)', address: '0x6bA05e742848d53E69d0C03FD0516E02CD18F20E' },
        { name: 'User Wallet 1 (ac09...)', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
        { name: 'User Wallet 2 (6268...)', address: '0x727ddCda2A47A92dF7D4D2104B9CC9c6435C20a8' }
    ];

    for (const w of wallets) {
        const balance = await provider.getBalance(w.address);
        console.log(`${w.name}: ${ethers.formatEther(balance)} OG (${w.address})`);
    }
}
checkBalances().catch(console.error);
