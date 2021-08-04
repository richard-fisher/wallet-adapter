/// <reference types="node" />
import { EventEmitter } from '@solana/wallet-adapter-base';
import { Connection, Keypair } from '@solana/web3.js';
import WalletConnectClient from '@walletconnect/client';
import { AppMetadata, SessionTypes } from '@walletconnect/types';
import { WalletConnectChainId, SolanaWalletConnectEventPayload, TransactionRequest } from './types';
export declare class SolanaWalletConnectSigner extends EventEmitter {
    private _client;
    private _keypair;
    private _connection;
    constructor(client: WalletConnectClient, keypair: Keypair, connection: Connection);
    approvePairing(proposal: SessionTypes.Proposal, metadata: AppMetadata, chainId?: WalletConnectChainId): Promise<SessionTypes.Settled>;
    signTransaction(transactionRequest: TransactionRequest, topic: string, request: SolanaWalletConnectEventPayload): Promise<Buffer>;
}
