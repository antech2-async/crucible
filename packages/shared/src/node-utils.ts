import { FetchRequest } from 'ethers';
import axios from 'axios';

/**
 * Workaround for Node v22 undici maxRedirections bug.
 * Replaces the global fetcher for Ethers v6 with an Axios-based one.
 */
export function setupEthersWorkaround() {
    // Disable global fetch to force ethers to use our custom fetcher
    try {
        // @ts-ignore
        global.fetch = undefined;
    } catch (e) {}

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
}
