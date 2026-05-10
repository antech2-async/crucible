import { FetchRequest } from 'ethers';
import axios from 'axios';

/**
 * Workaround for Node v22 undici maxRedirections bug.
 * Replaces the global fetcher for Ethers v6 with an Axios-based one.
 */
export function setupEthersWorkaround() {
  // Disable global fetch to force ethers to use our custom fetcher
  try {
    // Forcefully clear fetch so ethers uses FetchRequest.registerGetUrl (undici workaround on Node 22).
    (globalThis as { fetch?: unknown }).fetch = undefined;
  } catch (e) {
    // Silently continue if fetch is already undefined or immutable
  }

  FetchRequest.registerGetUrl(async (req) => {
    let lastError: any;
    for (let i = 0; i < 3; i++) {
      try {
        const response = await axios({
          url: req.url,
          method: req.method,
          data: req.body ? Buffer.from(req.body) : undefined,
          headers: req.headers,
          responseType: 'arraybuffer',
          timeout: 15000, // 15s timeout
        });
        return {
          statusCode: response.status,
          statusMessage: response.statusText,
          headers: response.headers as Record<string, string>,
          body: new Uint8Array(response.data),
        };
      } catch (err) {
        lastError = err;
        // Wait 1s before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw lastError;
  });
}
