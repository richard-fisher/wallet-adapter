import { EventEmitter } from '@solana/wallet-adapter-base';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client';
import { AppMetadata, ClientTypes, SessionTypes } from '@walletconnect/types';
import {
    WalletConnectChainId,
    SignTransactionPayload,
    WalletConnectRPCMethod,
    SolanaWalletConnectEvent,
    SolanaWalletConnectEventPayload,
    TransactionRequest,
} from './types';

export class SolanaWalletConnectSigner extends EventEmitter {
    private _client: WalletConnectClient;
    private _keypair: Keypair;
    private _connection: Connection;

    constructor(client: WalletConnectClient, keypair: Keypair, connection: Connection) {
        super();

        if (!client.controller) throw new Error('Signing client must be controller');

        client.on(CLIENT_EVENTS.session.proposal, async (proposal: SessionTypes.Proposal) => {
            this.emit(SolanaWalletConnectEvent.PAIRING_PROPOSAL, proposal);
        });

        client.on(CLIENT_EVENTS.session.request, async (requestParams: ClientTypes.RequestParams) => {
            // WalletConnect client can track multiple sessions
            // so we assert the topic from which the application requested signing
            const { topic } = requestParams;
            const request = requestParams.request as SolanaWalletConnectEventPayload;
            const session = await client.session.get(topic);

            const { metadata } = session.peer;

            const { method, params } = request;
            // we only emit events for supported methods
            if (method === WalletConnectRPCMethod.SOL_SIGN_TRANSACTION) {
                const transactionRequest: TransactionRequest = params;
                this.emit(SolanaWalletConnectEvent.REQUEST_SIGN_TRANSACTION, {
                    transactionRequest,
                    topic,
                    request,
                } as SignTransactionPayload);
            }
        });

        this._client = client;
        this._keypair = keypair;
        this._connection = connection;
    }

    async approvePairing(
        proposal: SessionTypes.Proposal,
        metadata: AppMetadata,
        chainId: WalletConnectChainId = WalletConnectChainId.SOL1
    ): Promise<SessionTypes.Settled> {
        const publicKey = this._keypair.publicKey.toBase58();

        return this._client.approve({
            proposal,
            response: {
                metadata,
                state: {
                    accounts: [`${publicKey}@${chainId}`],
                },
            },
        });
    }

    async signTransaction(
        transactionRequest: TransactionRequest,
        topic: string,
        request: SolanaWalletConnectEventPayload
    ): Promise<Buffer> {
        const publicKey = this._keypair.publicKey;

        const { blockhash } = await this._connection.getRecentBlockhash('max');

        const transaction = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey }).add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(transactionRequest.toPubkey),
                lamports: transactionRequest.lamports,
            })
        );

        transaction.partialSign(this._keypair);

        const signedTransaction = transaction.serialize();

        const response = {
            topic,
            response: {
                id: request.id,
                jsonrpc: request.jsonrpc,
                result: signedTransaction,
            },
        };

        await this._client.respond(response);

        return signedTransaction;
    }
}
