/// <reference types="node" />
import { EventEmitter } from '@solana/wallet-adapter-base';
import WalletConnectClient from '@walletconnect/client';
import { AppMetadata } from '@walletconnect/types';
import { WalletConnectChainId, PairResult, WalletConnectRPCMethod, TransactionRequest } from './types';
export declare const defaultChainIds: WalletConnectChainId[];
export declare const defaultJsonRpcMethods: WalletConnectRPCMethod[];
export declare class SolanaWalletConnectRequester extends EventEmitter {
    private _client;
    constructor(client: WalletConnectClient);
    proposePairing(metadata: AppMetadata, chains?: string[], methods?: string[]): Promise<PairResult>;
    requestSignTransaction(topic: string, transaction: TransactionRequest, chainId?: WalletConnectChainId): Promise<Buffer>;
}
