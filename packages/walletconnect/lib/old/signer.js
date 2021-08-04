var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter } from '@solana/wallet-adapter-base';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { CLIENT_EVENTS } from '@walletconnect/client';
import { WalletConnectChainId, WalletConnectRPCMethod, SolanaWalletConnectEvent, } from './types';
export class SolanaWalletConnectSigner extends EventEmitter {
    constructor(client, keypair, connection) {
        super();
        if (!client.controller)
            throw new Error('Signing client must be controller');
        client.on(CLIENT_EVENTS.session.proposal, (proposal) => __awaiter(this, void 0, void 0, function* () {
            this.emit(SolanaWalletConnectEvent.PAIRING_PROPOSAL, proposal);
        }));
        client.on(CLIENT_EVENTS.session.request, (requestParams) => __awaiter(this, void 0, void 0, function* () {
            // WalletConnect client can track multiple sessions
            // so we assert the topic from which the application requested signing
            const { topic } = requestParams;
            const request = requestParams.request;
            const session = yield client.session.get(topic);
            const { metadata } = session.peer;
            const { method, params } = request;
            // we only emit events for supported methods
            if (method === WalletConnectRPCMethod.SOL_SIGN_TRANSACTION) {
                const transactionRequest = params;
                this.emit(SolanaWalletConnectEvent.REQUEST_SIGN_TRANSACTION, {
                    transactionRequest,
                    topic,
                    request,
                });
            }
        }));
        this._client = client;
        this._keypair = keypair;
        this._connection = connection;
    }
    approvePairing(proposal, metadata, chainId = WalletConnectChainId.SOL1) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    signTransaction(transactionRequest, topic, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const publicKey = this._keypair.publicKey;
            const { blockhash } = yield this._connection.getRecentBlockhash('max');
            const transaction = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey }).add(SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(transactionRequest.toPubkey),
                lamports: transactionRequest.lamports,
            }));
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
            yield this._client.respond(response);
            return signedTransaction;
        });
    }
}
//# sourceMappingURL=signer.js.map