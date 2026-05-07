import { FetchRequest } from 'ethers';
import axios from 'axios';

/**
 * Workaround for Node v22 undici maxRedirections bug.
 * Replaces the global fetcher for Ethers v6 with an Axios-based one.
 */
export function setupEthersWorkaround() {
  // Disable global fetch to force ethers to use our custom fetcher
  try {
    // @ts-expect-error - Forcefully nulling fetch to workaround undici bug
    global.fetch = undefined;
  } catch (e) {
    // Silently continue if fetch is already undefined or immutable
  }

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
      headers: response.headers as Record<string, string>,
      body: new Uint8Array(response.data),
    };
  });
}
