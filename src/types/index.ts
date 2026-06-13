import type { Address } from 'viem';

export type ChainKind = 'testnet' | 'mainnet';

export interface TokenMeta {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  coingeckoId?: string;
}

export interface FaucetDeployment {
  token: Address;
  faucet: Address;
}

export interface SupportedChain {
  id: number;
  name: string;
  shortName: string;
  kind: ChainKind;
  nativeSymbol: string;
  /** CoinGecko id for the native asset (e.g. "ethereum"). */
  nativeCoingeckoId: string;
  explorerUrl: string;
  /** Present on testnets that have our deployed faucet + token. */
  faucet?: FaucetDeployment;
  /** ERC-20s shown in the portfolio for this chain. */
  trackedTokens: TokenMeta[];
}

export interface NativeBalance {
  symbol: string;
  raw: string;
  formatted: string;
  usdValue: number | null;
}

export interface TokenBalance {
  token: TokenMeta;
  raw: string;
  formatted: string;
  usdValue: number | null;
}

export interface ChainPortfolio {
  chainId: number;
  chainName: string;
  native: NativeBalance;
  tokens: TokenBalance[];
  totalUsd: number;
}

export interface FaucetState {
  chainId: number;
  dripFormatted: string;
  canClaim: boolean;
  secondsRemaining: number;
}

export type TransferDirection = 'in' | 'out' | 'self';

export interface Transfer {
  hash: string;
  from: Address;
  to: Address;
  asset: string;
  value: string;
  timestamp: number | null;
  direction: TransferDirection;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
