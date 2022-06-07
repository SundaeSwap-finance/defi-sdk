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
