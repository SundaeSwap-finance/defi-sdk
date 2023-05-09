import { Fraction, TFractionLike, TIntegerLike } from "@sundaeswap/fraction";
import { IHasStringId, stringIdEquals, TFungibleToken } from "./Asset";

/**
 * Represent a Fungible token with BigInt amount, decimals and id.
 * Immutable
 */
export class AssetAmount implements TFungibleToken {
  static readonly DEFAULT_FUNGIBLE_TOKEN_ID = "";
  static readonly DEFAULT_FUNGIBLE_TOKEN_DECIMALS = 0;

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
   * @param id
   * @returns
   */
  static fromValue(
    value: TFractionLike,
    decimals: number = AssetAmount.DEFAULT_FUNGIBLE_TOKEN_DECIMALS,
    id?: string
  ): AssetAmount {
    return new AssetAmount(
      Fraction.asFraction(value).multiply(10 ** decimals).quotient,
      decimals,
      id
    );
  }

  /**
   * Create new `AssetAmount` with `amount`, `decimals` and `id`
   * @param amount the token amount, bigint represented as string, number or bigint. Default: 0n
   * @param decimals the token decimals, default is 0
   * @param id the token id, default is empty string
   */
  constructor(
    amount: TIntegerLike = 0n,
    decimals = AssetAmount.DEFAULT_FUNGIBLE_TOKEN_DECIMALS,
    id = AssetAmount.DEFAULT_FUNGIBLE_TOKEN_ID
  ) {
    this.id = id;
    this.decimals = decimals;
    this.amount = BigInt(amount);
    this.value = AssetAmount.toValue(this.amount, this.decimals);
  }

  withAmount = (amount: TIntegerLike): AssetAmount => {
    return new AssetAmount(amount, this.decimals, this.id);
  };

  withValue = (value: TFractionLike): AssetAmount => {
    return AssetAmount.fromValue(value, this.decimals, this.id);
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
