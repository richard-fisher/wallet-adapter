import {
    EventEmitter,
    WalletAccountError,
    WalletAdapter,
    WalletAdapterEvents,
    WalletConnectionError,
    WalletDisconnectionError,
    WalletNotConnectedError,
    WalletPublicKeyError,
    WalletSignatureError,
} from '@solana/wallet-adapter-base';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { PublicKey, Transaction } from '@solana/web3.js';
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client';
import { ClientOptions, ClientTypes, PairingTypes, SessionTypes } from '@walletconnect/types';

export enum WalletConnectChainID {
    SOL1 = 'sol:1',
}

export enum WalletConnectRPCMethod {
    SOL_SIGN_TRANSACTION = 'sol_signTransaction',
}

export interface WalletConnectWalletAdapterConfig {
    options: ClientOptions;
    params?: ClientTypes.ConnectParams;
}

export class WalletConnectWalletAdapter extends EventEmitter<WalletAdapterEvents> implements WalletAdapter {
    private _publicKey: PublicKey | null;
    private _connecting: boolean;
    private _options: ClientOptions;
    private _params: ClientTypes.ConnectParams;
    private _client: WalletConnectClient | undefined;

    constructor(config: WalletConnectWalletAdapterConfig) {
        super();

        this._publicKey = null;
        this._connecting = false;
        this._options = config.options;
        this._params = config.params || {
            permissions: {
                blockchain: { chains: [WalletConnectChainID.SOL1] },
                jsonrpc: { methods: [WalletConnectRPCMethod.SOL_SIGN_TRANSACTION] },
            },
        };
    }

    get publicKey(): PublicKey | null {
        return this._publicKey;
    }

    get ready(): boolean {
        return true;
    }

    get connecting(): boolean {
        return this._connecting;
    }

    get connected(): boolean {
        return !!this._publicKey;
    }

    get autoApprove(): boolean {
        return false;
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            this._connecting = true;

            let client: WalletConnectClient;
            let session: SessionTypes.Settled;
            try {
                client = await WalletConnectClient.init(this._options);

                client.on(CLIENT_EVENTS.pairing.proposal, async (proposal: PairingTypes.Proposal) => {
                    const { uri } = proposal.signal.params;
                    console.log('EVENT', 'QR Code Modal open');
                    QRCodeModal.open(uri, () => {
                        console.log('EVENT', 'QR Code Modal closed');
                    });
                });

                client.on(CLIENT_EVENTS.pairing.created, async (proposal: PairingTypes.Settled) => {
                    console.log('EVENT', 'Pairing created');
                });

                client.on(CLIENT_EVENTS.session.deleted, (session: SessionTypes.Settled) => {
                    console.log('EVENT', 'session_deleted');
                });

                session = await client.connect(this._params);
            } catch (error) {
                throw new WalletConnectionError(error.message, error);
            }

            if (!session.state.accounts.length) throw new WalletAccountError();
            const account = session.state.accounts[0].split('@')[0];
            if (!account) throw new WalletAccountError();

            let publicKey: PublicKey;
            try {
                publicKey = new PublicKey(account);
            } catch (error) {
                throw new WalletPublicKeyError(error.message, error);
            }

            // @TODO: add events

            this._publicKey = publicKey;
            this._client = client;
            this.emit('connect');
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const client = this._client;
        if (client) {
            this._publicKey = null;
            this._client = undefined;

            try {
                // @FIXME
                // await provider.disconnect();
            } catch (error) {
                this.emit('error', new WalletDisconnectionError(error.message, error));
            }

            this.emit('disconnect');
        }
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
        try {
            const client = this._client;
            const publicKey = this._publicKey;
            if (!client || !publicKey) throw new WalletNotConnectedError();

            try {
                // @FIXME
                // const signature = await signTransaction(client, transaction, this._derivationPath);
                // transaction.addSignature(publicKey, signature);
            } catch (error) {
                throw new WalletSignatureError(error?.message, error);
            }

            return transaction;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        try {
            const provider = this._client;
            const publicKey = this._publicKey;
            if (!provider || !publicKey) throw new WalletNotConnectedError();

            try {
                // @FIXME
                // for (const transaction of transactions) {
                //     const signature = await signTransaction(provider, transaction, derivationPath);
                //     transaction.addSignature(publicKey, signature);
                // }
            } catch (error) {
                throw new WalletSignatureError(error?.message, error);
            }

            return transactions;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
}
