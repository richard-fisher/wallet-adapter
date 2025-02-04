import Transport from '@ledgerhq/hw-transport';
import TransportWebHid from '@ledgerhq/hw-transport-webhid';
import {
    EventEmitter,
    WalletAdapter,
    WalletAdapterEvents,
    WalletConnectionError,
    WalletDisconnectedError,
    WalletDisconnectionError,
    WalletNotConnectedError,
    WalletPublicKeyError,
    WalletSignatureError,
} from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getDerivationPath, getPublicKey, signTransaction } from './util';

export interface LedgerWalletAdapterConfig {
    derivationPath?: Buffer;
}

export class LedgerWalletAdapter extends EventEmitter<WalletAdapterEvents> implements WalletAdapter {
    private _derivationPath: Buffer;
    private _connecting: boolean;
    private _transport: Transport | null;
    private _publicKey: PublicKey | null;

    constructor(config: LedgerWalletAdapterConfig = {}) {
        super();
        this._derivationPath = config.derivationPath || getDerivationPath(0, 0);
        this._connecting = false;
        this._transport = null;
        this._publicKey = null;
    }

    get publicKey(): PublicKey | null {
        return this._publicKey;
    }

    get ready(): boolean {
        // @FIXME: could return !!navigator.hid
        return true;
    }

    get connecting(): boolean {
        return this._connecting;
    }

    get connected(): boolean {
        return !!this._transport;
    }

    get autoApprove(): boolean {
        return false;
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            this._connecting = true;

            let transport: Transport;
            try {
                transport = await TransportWebHid.create();
            } catch (error) {
                throw new WalletConnectionError(error?.message, error);
            }

            let publicKey: PublicKey;
            try {
                publicKey = await getPublicKey(transport, this._derivationPath);
            } catch (error) {
                throw new WalletPublicKeyError(error?.message, error);
            }

            transport.on('disconnect', this._disconnected);

            this._transport = transport;
            this._publicKey = publicKey;

            this.emit('connect');
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const transport = this._transport;
        if (transport) {
            transport.off('disconnect', this._disconnected);

            this._transport = null;
            this._publicKey = null;

            try {
                await transport.close();
            } catch (error) {
                this.emit('error', new WalletDisconnectionError(error.message, error));
            }

            this.emit('disconnect');
        }
    }

    async signMessage(message: Uint8Array, display: unknown): Promise<{ signature: Buffer; publicKey: PublicKey; }> {
        throw new Error('not implemented');
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
        try {
            const transport = this._transport;
            const publicKey = this._publicKey;
            if (!transport || !publicKey) throw new WalletNotConnectedError();

            try {
                const signature = await signTransaction(transport, transaction, this._derivationPath);
                transaction.addSignature(publicKey, signature);
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
            const transport = this._transport;
            const publicKey = this._publicKey;
            if (!transport || !publicKey) throw new WalletNotConnectedError();

            try {
                const derivationPath = this._derivationPath;
                for (const transaction of transactions) {
                    const signature = await signTransaction(transport, transaction, derivationPath);
                    transaction.addSignature(publicKey, signature);
                }
            } catch (error) {
                throw new WalletSignatureError(error?.message, error);
            }

            return transactions;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    private _disconnected = () => {
        const transport = this._transport;
        if (transport) {
            transport.off('disconnect', this._disconnected);

            this._transport = null;
            this._publicKey = null;

            this.emit('error', new WalletDisconnectedError());
            this.emit('disconnect');
        }
    };
}
