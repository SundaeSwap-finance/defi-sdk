// export class Asset {
//   public readonly decimals: number;
//   public readonly assetId: string;
//   constructor(assetId) {}
// }

export interface IFungibleAsset {
  amount: bigint;
}

export interface IHasDecimals {
  decimals: number;
}

export interface IHasStringId {
  id: string;
}

export type TFungibleToken = IFungibleAsset & IHasDecimals & IHasStringId;

export type TNonFungibleToken = IHasStringId;

export const stringIdEquals = (a: IHasStringId, b: IHasStringId) =>
  a.id === b.id;

export enum ETokenMetadataSource {
  CardanoTokenRegistry = "CardanoTokenRegistry",
  OnChainLabel20 = "OnChainLabel20",
  OnChainLabel721 = "OnChainLabel721",
}

export interface IAsset {
  /** hex encoded policyId + hex encoded asset name */
  assetId: string;
  /** hex encoded asset name (ledger: asset_name) */
  assetName?: string;
  /**
   * the project's website
   *  websiteUrl: String
   * the project's description
   *  description: String
   * listed date for token (ISO8601: yyyy-mm-dd)
   */
  dateListed: string;
  /** token decimal places (defaults to 0) */
  decimals: number;
  /** description of asset */
  description?: string;
  /** logo url or base64 encoded logo */
  logo?: string;
  /** market cap of token */
  marketCap?: string;
  /** hex encoded policyId, 56 chars length (ledger: policy_id) */
  policyId: string;
  /** sources define where the token metadata is sourced from */
  sources?: ETokenMetadataSource[];
  /** ticker (max 6-8 characters ?) */
  ticker?: string;
  /** total supply of tokens */
  totalSupply?: string;
  tvl?: string;
}
