/**
 * Modular wallet interface for address management
 * Designed to support both typed addresses and connected wallets
 */

import { PublicKey } from '@solana/web3.js';

export interface WalletAddress {
  address: string;
  publicKey: PublicKey;
  source: 'typed' | 'connected';
}

export interface IWalletProvider {
  getAddress(): Promise<string>;
  getPublicKey(): Promise<PublicKey>;
  getSource(): 'typed' | 'connected';
  isConnected(): boolean;
}

/**
 * Typed address provider - for manual address entry
 * This will be used initially before wallet-connect integration
 */
export class TypedAddressProvider implements IWalletProvider {
  private address: string;
  private publicKey: PublicKey;

  constructor(address: string) {
    this.validateAddress(address);
    this.address = address;
    this.publicKey = new PublicKey(address);
  }

  private validateAddress(address: string): void {
    try {
      new PublicKey(address);
    } catch {
      throw new Error(`Invalid Solana address: ${address}`);
    }
  }

  async getAddress(): Promise<string> {
    return this.address;
  }

  async getPublicKey(): Promise<PublicKey> {
    return this.publicKey;
  }

  getSource(): 'typed' {
    return 'typed';
  }

  isConnected(): boolean {
    return true;
  }
}

/**
 * Connected wallet provider - for wallet-connect integration
 * This is a placeholder that will be implemented when wallet-connect is added
 */
export class ConnectedWalletProvider implements IWalletProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private wallet: any; // Will be typed properly when wallet-connect is integrated

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(wallet: any) {
    this.wallet = wallet;
  }

  async getAddress(): Promise<string> {
    // Implementation will depend on wallet-connect library
    if (!this.wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }
    return this.wallet.publicKey.toString();
  }

  async getPublicKey(): Promise<PublicKey> {
    if (!this.wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }
    return this.wallet.publicKey;
  }

  getSource(): 'connected' {
    return 'connected';
  }

  isConnected(): boolean {
    return !!this.wallet?.publicKey;
  }
}

/**
 * Wallet factory - creates appropriate provider based on input
 */
export class WalletFactory {
  /**
   * Create a typed address provider
   */
  static createTypedAddress(address: string): IWalletProvider {
    return new TypedAddressProvider(address);
  }

  /**
   * Create a connected wallet provider (for future use)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createConnectedWallet(wallet: any): IWalletProvider {
    return new ConnectedWalletProvider(wallet);
  }

  /**
   * Create provider from either typed address or connected wallet
   * This abstraction allows downstream logic to remain unchanged
   * when switching from typed to connected wallets
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createProvider(input: string | any): IWalletProvider {
    if (typeof input === 'string') {
      return WalletFactory.createTypedAddress(input);
    }
    return WalletFactory.createConnectedWallet(input);
  }
}
