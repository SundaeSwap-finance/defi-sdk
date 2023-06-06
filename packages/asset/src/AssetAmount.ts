import { Fraction, TFractionLike, TIntegerLike } from "@sundaeswap/fraction";
import { IHasStringId, stringIdEquals, TFungibleToken } from "./Asset";

export interface IAssetAmountMetadata {
  id?: string;
  assetId: string;
  decimals: number;
}

export class AssetRatio<T extends IAssetAmountMetadata = IAssetAmountMetadata> {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public numerator: AssetAmount<T>,
    public denominator: AssetAmount<T>
  ) {}
}

/**
 * Represent a Fungible token with BigInt amount, decimals and id.
 * Immutable
 */
export class AssetAmount<T extends IAssetAmountMetadata = IAssetAmountMetadata>
  implements TFungibleToken
{
  static readonly DEFAULT_FUNGIBLE_TOKEN_DECIMALS = 0;

  readonly metadata: T;
  readonly id: string;
  readonly decimals: number;
  readonly amount: bigint;
  readonly value: Fraction;

  /**
   * Represent a token amount and decimals as `Fraction` (`value`)
   * @param amount
   * @param decimals
   * @returns
   */
  static toValue(amount: bigint, decimals = 0): Fraction {
    return new Fraction(amount, 10n ** BigInt(decimals));
  }

  /**
   * Create a new `AssetAmount` with fraction like `value`, `decimals` and `id`
   * @param value
   * @param decimals
   * @returns
   */
  static fromValue<T extends IAssetAmountMetadata = IAssetAmountMetadata>(
    value: TFractionLike,
    metadata: number | T = AssetAmount.DEFAULT_FUNGIBLE_TOKEN_DECIMALS
  ): AssetAmount {
    let decimals = typeof metadata === "number" ? metadata : metadata.decimals;
    return new AssetAmount<T>(
      Fraction.asFraction(value).multiply(10 ** decimals).quotient,
      metadata
    );
  }

  /**
   * Create new `AssetAmount` with `amount`, `decimals` and `metadata`
   * @param amount the token amount, bigint represented as string, number or bigint. Default: 0n
   * @param decimals the token decimals, default is 0
   * @param metadata the metadata associated with the asset amount.
   */
  constructor(
    amount: TIntegerLike = 0n,
    metadata: number | T = AssetAmount.DEFAULT_FUNGIBLE_TOKEN_DECIMALS
  ) {
    this.amount = BigInt(amount);
    this.decimals = typeof metadata === "number" ? metadata : metadata.decimals;
    this.metadata = typeof metadata === "number" ? undefined : metadata;
    this.id = typeof metadata === "number" ? undefined : metadata.id;
    this.value = AssetAmount.toValue(this.amount, this.decimals);
  }

  withAmount = <T extends IAssetAmountMetadata = IAssetAmountMetadata>(
    amount: TIntegerLike,
    metadata?: T
  ): AssetAmount => {
    return new AssetAmount<T>(amount, metadata);
  };

  withValue = <T extends IAssetAmountMetadata = IAssetAmountMetadata>(
    value: TFractionLike,
    metadata?: T
  ): AssetAmount => {
    return AssetAmount.fromValue<T>(value, metadata);
  };

  add = (rhs: AssetAmount): AssetAmount => {
    return this.withAmount(this.amount + rhs.amount);
  };
  plus = this.add;

  subtract = (rhs: AssetAmount): AssetAmount => {
    return this.withAmount(this.amount - rhs.amount);
  };
  minus = this.subtract;
  sub = this.subtract;

  addValue = (value: TFractionLike): AssetAmount => {
    return this.withValue(this.value.add(value));
  };
  plusValue = this.add;

  subtractValue = (value: TFractionLike): AssetAmount => {
    return this.withValue(this.value.sub(value));
  };
  minusValue = this.subtract;
  subValue = this.subtract;

  equalsAssetId = (rhs: IHasStringId): boolean => {
    return stringIdEquals(this, rhs);
  };
  isSameAsset = this.equalsAssetId;
}
