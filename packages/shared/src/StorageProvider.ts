import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * High-fidelity Storage Provider for Crucible.
 * Acts as a bridge between the coordination layer and decentralized storage.
 * In MVP mode, it uses deterministic URIs and local indexing to simulate 0G Storage behavior.
 */
export class StorageProvider {
  private static instance: StorageProvider;
  private storagePath: string;

  private constructor() {
    this.storagePath = path.join(os.tmpdir(), 'crucible-0g-mock-storage.json');
    if (!fs.existsSync(this.storagePath)) {
      fs.writeFileSync(this.storagePath, JSON.stringify({}));
    }
  }

  public static getInstance(): StorageProvider {
    if (!StorageProvider.instance) {
      StorageProvider.instance = new StorageProvider();
    }
    return StorageProvider.instance;
  }

  /**
   * Commits content to the 'decentralized' storage and returns its Merkle root / Hash.
   */
  public async commit(content: string): Promise<{ hash: string; uri: string }> {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(content));
    const uri = hash; // The hash is the primary identifier (CID logic)
    
    // Index it to filesystem
    const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    data[uri] = content;
    fs.writeFileSync(this.storagePath, JSON.stringify(data));
    
    return { hash, uri };
  }

  /**
   * Retrieves content by its 0G URI.
   */
  public async fetch(uri: string): Promise<string> {
    const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    const content = data[uri];
    if (!content) {
      console.warn(`StorageProvider: URI ${uri} not found in mock index.`);
      return "SIMULATED_CONTENT: Data retrieval in progress...";
    }
    return content;
  }

  /**
   * Verifies that the fetched content matches the expected hash.
   */
  public verify(content: string, expectedHash: string): boolean {
    const actualHash = ethers.keccak256(ethers.toUtf8Bytes(content));
    return actualHash === expectedHash;
  }
}

export const storage = StorageProvider.getInstance();
