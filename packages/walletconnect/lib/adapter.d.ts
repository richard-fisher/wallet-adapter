import { EventEmitter, WalletAdapter, WalletAdapterEvents } from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';
import { ClientOptions, ClientTypes } from '@walletconnect/types';
export declare enum WalletConnectChainID {
    SOL1 = "sol:1"
}
export declare enum WalletConnectRPCMethod {
    SOL_SIGN_TRANSACTION = "sol_signTransaction"
}
export interface WalletConnectWalletAdapterConfig {
    options: ClientOptions;
    params?: ClientTypes.ConnectParams;
}
export declare class WalletConnectWalletAdapter extends EventEmitter<WalletAdapterEvents> implements WalletAdapter {
    private _publicKey;
    private _connecting;
    private _options;
    private _params;
    private _client;
    constructor(config: WalletConnectWalletAdapterConfig);
    get publicKey(): PublicKey | null;
    get ready(): boolean;
    get connecting(): boolean;
    get connected(): boolean;
    get autoApprove(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}
