var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter, WalletAccountError, WalletConnectionError, WalletDisconnectionError, WalletNotConnectedError, WalletPublicKeyError, WalletSignatureError, } from '@solana/wallet-adapter-base';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { PublicKey } from '@solana/web3.js';
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client';
export var WalletConnectChainID;
(function (WalletConnectChainID) {
    WalletConnectChainID["SOL1"] = "sol:1";
})(WalletConnectChainID || (WalletConnectChainID = {}));
export var WalletConnectRPCMethod;
(function (WalletConnectRPCMethod) {
    WalletConnectRPCMethod["SOL_SIGN_TRANSACTION"] = "sol_signTransaction";
})(WalletConnectRPCMethod || (WalletConnectRPCMethod = {}));
export class WalletConnectWalletAdapter extends EventEmitter {
    constructor(config) {
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
    get publicKey() {
        return this._publicKey;
    }
    get ready() {
        return true;
    }
    get connecting() {
        return this._connecting;
    }
    get connected() {
        return !!this._publicKey;
    }
    get autoApprove() {
        return false;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.connected || this.connecting)
                    return;
                this._connecting = true;
                let client;
                let session;
                try {
                    client = yield WalletConnectClient.init(this._options);
                    client.on(CLIENT_EVENTS.pairing.proposal, (proposal) => __awaiter(this, void 0, void 0, function* () {
                        const { uri } = proposal.signal.params;
                        console.log('EVENT', 'QR Code Modal open');
                        QRCodeModal.open(uri, () => {
                            console.log('EVENT', 'QR Code Modal closed');
                        });
                    }));
                    client.on(CLIENT_EVENTS.pairing.created, (proposal) => __awaiter(this, void 0, void 0, function* () {
                        console.log('EVENT', 'Pairing created');
                    }));
                    client.on(CLIENT_EVENTS.session.deleted, (session) => {
                        console.log('EVENT', 'session_deleted');
                    });
                    session = yield client.connect(this._params);
                }
                catch (error) {
                    throw new WalletConnectionError(error.message, error);
                }
                if (!session.state.accounts.length)
                    throw new WalletAccountError();
                const account = session.state.accounts[0].split('@')[0];
                if (!account)
                    throw new WalletAccountError();
                let publicKey;
                try {
                    publicKey = new PublicKey(account);
                }
                catch (error) {
                    throw new WalletPublicKeyError(error.message, error);
                }
                // @TODO: add events
                this._publicKey = publicKey;
                this._client = client;
                this.emit('connect');
            }
            catch (error) {
                this.emit('error', error);
                throw error;
            }
            finally {
                this._connecting = false;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = this._client;
            if (client) {
                this._publicKey = null;
                this._client = undefined;
                try {
                    // @FIXME
                    // await provider.disconnect();
                }
                catch (error) {
                    this.emit('error', new WalletDisconnectionError(error.message, error));
                }
                this.emit('disconnect');
            }
        });
    }
    signTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this._client;
                const publicKey = this._publicKey;
                if (!client || !publicKey)
                    throw new WalletNotConnectedError();
                try {
                    // @FIXME
                    // const signature = await signTransaction(client, transaction, this._derivationPath);
                    // transaction.addSignature(publicKey, signature);
                }
                catch (error) {
                    throw new WalletSignatureError(error === null || error === void 0 ? void 0 : error.message, error);
                }
                return transaction;
            }
            catch (error) {
                this.emit('error', error);
                throw error;
            }
        });
    }
    signAllTransactions(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const provider = this._client;
                const publicKey = this._publicKey;
                if (!provider || !publicKey)
                    throw new WalletNotConnectedError();
                try {
                    // @FIXME
                    // for (const transaction of transactions) {
                    //     const signature = await signTransaction(provider, transaction, derivationPath);
                    //     transaction.addSignature(publicKey, signature);
                    // }
                }
                catch (error) {
                    throw new WalletSignatureError(error === null || error === void 0 ? void 0 : error.message, error);
                }
                return transactions;
            }
            catch (error) {
                this.emit('error', error);
                throw error;
            }
        });
    }
}
//# sourceMappingURL=adapter.js.map