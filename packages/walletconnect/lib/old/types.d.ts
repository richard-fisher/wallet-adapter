export declare enum WalletConnectChainId {
    SOL1 = "sol:1"
}
export declare enum WalletConnectRPCMethod {
    SOL_SIGN_TRANSACTION = "sol_signTransaction"
}
export declare enum SolanaWalletConnectEvent {
    REQUEST_SIGN_TRANSACTION = "request_sign_transaction",
    PAIRING_PROPOSAL = "pairing_proposal"
}
export interface TransactionRequest {
    fromPubkey: string;
    toPubkey: string;
    lamports: number;
}
export interface PairResult {
    session: any;
    publicKey: string;
}
export interface SolanaWalletConnectEventPayload {
    jsonrpc: string;
    id: number;
    method: string;
    params: any;
}
export interface SignTransactionPayload {
    transactionRequest: TransactionRequest;
    topic: string;
    request: SolanaWalletConnectEventPayload;
}
