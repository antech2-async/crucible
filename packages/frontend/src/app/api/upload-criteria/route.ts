import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Indexer, MemData } from '@0glabs/0g-ts-sdk';

export async function POST(request: Request) {
    const criteria = await request.json();

    const provider = new ethers.JsonRpcProvider(
        process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai'
    );
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const indexer = new Indexer(
        process.env.OG_STORAGE_INDEXER_URL || 'https://indexer-storage-testnet-turbo.0g.ai'
    );

    try {
        const jsonString = JSON.stringify(criteria);
        const memData = new MemData(Buffer.from(jsonString));

        const [tree, treeErr] = await memData.merkleTree();
        if (treeErr) throw new Error(`Merkle error: ${treeErr}`);

        const rootHash = tree!.rootHash()!;
        // @ts-ignore
        const [, uploadErr] = await indexer.upload(memData, process.env.OG_RPC_URL!, signer, undefined, undefined, { gasLimit: 500000 });
        
        if (uploadErr && !uploadErr.toString().includes('timeout')) {
            throw new Error(`Upload error: ${uploadErr}`);
        } else if (uploadErr) {
            console.log('Upload timed out but transaction was likely broadcast. Proceeding...');
        }

        const bytes32Hash = ethers.keccak256(ethers.toUtf8Bytes(rootHash));

        return NextResponse.json({ rootHash, bytes32Hash });
    } catch (error) {
        console.error('Criteria upload failed:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
