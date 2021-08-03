import { EventEmitter } from '@solana/wallet-adapter-base';
import WalletConnectClient from '@walletconnect/client';
import { AppMetadata } from '@walletconnect/types';
import { ChainIdType, PairResult, SolanaRPCMethodType, TransactionRequest } from './types';

export const defaultChainIds = [ChainIdType.SOL1];
export const defaultJsonRpcMethods = [SolanaRPCMethodType.SOL_SIGN_TRANSACTION];

export class SolanaWalletConnectRequester extends EventEmitter {
    private _client: WalletConnectClient;

    constructor(client: WalletConnectClient) {
        super();

        this._client = client;
    }

    async proposePairing(
        metadata: AppMetadata,
        chains: string[] = defaultChainIds,
        methods: string[] = defaultJsonRpcMethods
    ): Promise<PairResult> {
        const session = await this._client.connect({
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
    }

    async requestSignTransaction(
        topic: string,
        transaction: TransactionRequest,
        chainId: ChainIdType = ChainIdType.SOL1
    ): Promise<Buffer> {
        return await this._client.request({
            topic,
            chainId,
            request: {
                method: SolanaRPCMethodType.SOL_SIGN_TRANSACTION,
                params: transaction,
            },
        });
    }
}
