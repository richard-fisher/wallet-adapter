import { WalletAdapter } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, PhantomWalletAdapterConfig } from '@solana/wallet-adapter-phantom';
import { SolletWalletAdapter, SolletWalletAdapterConfig } from '@solana/wallet-adapter-sollet';

export enum WalletName {
    Phantom = 'Phantom',
    Sollet = 'Sollet'
}

export interface Wallet {
    name: WalletName;
    url: string;
    icon: string;
    adapter: () => WalletAdapter;
}

export const ICONS_URL = 'https://raw.githubusercontent.com/richard-fisher/wallet-adapter/master/packages/wallets/icons';

export const getPhantomWallet = (config?: PhantomWalletAdapterConfig): Wallet => ({
    name: WalletName.Phantom,
    url: 'https://www.phantom.app',
    icon: `${ICONS_URL}/phantom.svg`,
    adapter: () => new PhantomWalletAdapter(config),
});

export const getSolletWallet = (config?: SolletWalletAdapterConfig): Wallet => ({
    name: WalletName.Sollet,
    url: 'https://www.sollet.io',
    icon: `${ICONS_URL}/sollet.svg`,
    adapter: () => new SolletWalletAdapter(config),
});
