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
import { WalletConnectChainId, WalletConnectRPCMethod } from './types';
export const defaultChainIds = [WalletConnectChainId.SOL1];
export const defaultJsonRpcMethods = [WalletConnectRPCMethod.SOL_SIGN_TRANSACTION];
export class SolanaWalletConnectRequester extends EventEmitter {
    constructor(client) {
        super();
        this._client = client;
    }
    proposePairing(metadata, chains = defaultChainIds, methods = defaultJsonRpcMethods) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this._client.connect({
                metadata,
                permissions: {
                    blockchain: { chains },
                    jsonrpc: { methods },
                },
            });
            if (session.state.accounts.length === 0) {
                throw new Error('Unable to establish wallet connect session. No public key returned');
            }
            const connectedAccount = session.state.accounts[0];
            const publicKey = connectedAccount.split('@')[0];
            if (!publicKey) {
                throw new Error(`Unable to extract public key from returned account ${connectedAccount}`);
            }
            return {
                publicKey,
                session,
            };
        });
    }
    requestSignTransaction(topic, transaction, chainId = WalletConnectChainId.SOL1) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._client.request({
                topic,
                chainId,
                request: {
                    method: WalletConnectRPCMethod.SOL_SIGN_TRANSACTION,
                    params: transaction,
                },
            });
        });
    }
}
//# sourceMappingURL=requester.js.map