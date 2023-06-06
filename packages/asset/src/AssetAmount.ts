import { Fraction, TFractionLike, TIntegerLike } from "@sundaeswap/fraction";
import { IHasStringId, stringIdEquals, TFungibleToken } from "./Asset";

export interface IAssetAmountMetadata {
  id?: string;
  assetId: string;
  decimals: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export class AssetRatio<T extends IAssetAmountMetadata> {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public numerator: AssetAmount<T>,
    public denominator: AssetAmount<T>
  ) {}
}

/**
 * Class representing a fungible token with BigInt amount, decimals and id.
 * @template T
 * @extends {IAssetAmountMetadata}
 * @implements {TFungibleToken}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AssetAmount<T extends IAssetAmountMetadata = any>
  implements TFungibleToken
{
  static readonly DEFAULT_FUNGIBLE_TOKEN_DECIMALS = 0;
  static INVALID_METADATA =
    "Cannot perform exchange calculation on an AssetAmount with no metadata.";
  static INVALID_MULTIPLICATION_ERROR = "Cannot multiply incompatible assets.";
  static INVALID_DIVISION_ERROR = "Cannot divide incompatible assets.";

  readonly metadata: T;
  readonly id: string;
  readonly decimals: number;
  readonly amount: bigint;
  readonly value: Fraction;

  /**
   * Represent a token amount and decimals as `Fraction` (`value`)
   * @param {bigint} amount - The amount of token.
   * @param {number} decimals - The decimal places of the token amount.
   * @returns {Fraction} - The token amount represented as a fraction.
   */
  static toValue(amount: bigint, decimals = 0): Fraction {
    return new Fraction(amount, 10n ** BigInt(decimals));
  }

  /**
   * Creates a new `AssetAmount` instance with fraction like `value`, `decimals` and `id`
   * @template T
   * @param {TFractionLike} value - The token amount represented as a fraction.
   * @param {number | T} metadata - The metadata associated with the asset amount.
   * @returns {AssetAmount} - A new AssetAmount instance.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromValue<T extends IAssetAmountMetadata = any>(
    value: TFractionLike,
    metadata: number | T = AssetAmount.DEFAULT_FUNGIBLE_TOKEN_DECIMALS
  ): AssetAmount<T> {
    let decimals = typeof metadata === "number" ? metadata : metadata.decimals;
    return new AssetAmount<T>(
      Fraction.asFraction(value).multiply(10 ** decimals).quotient,
      metadata
    );
  }

  /**
   * Creates a new `AssetAmount` instance with `amount`, `decimals` and `metadata`
   * @param {TIntegerLike} amount - The token amount, bigint represented as string, number or bigint. Default: 0n.
   * @param {number | T} metadata - The metadata associated with the asset amount.
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withAmount = <T extends IAssetAmountMetadata = any>(
    amount: TIntegerLike,
    metadata?: T
  ): AssetAmount => {
    return new AssetAmount<T>(amount, metadata);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withValue = <T extends IAssetAmountMetadata = any>(
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

  /**
   * Multiplies the asset amount with an asset ratio and returns a new AssetAmount.
   * @param {AssetRatio<T>} ar - The asset ratio to multiply with.
   * @throws {Error} - Throws an error if the metadata is invalid or if the metadata does not match with the denominator's metadata.
   * @returns {AssetAmount} - A new AssetAmount representing the multiplication result.
   */
  exchangeMultiply(ar: AssetRatio<T>): AssetAmount {
    if (!this.metadata || !ar.denominator.metadata || !ar.numerator.metadata) {
      throw new Error(AssetAmount.INVALID_METADATA);
    }

    if (this.metadata !== ar.denominator.metadata) {
      throw new Error(AssetAmount.INVALID_MULTIPLICATION_ERROR);
    }

    return new AssetAmount<T>(
      (this.amount * ar.numerator.amount) / ar.denominator.amount,
      ar.numerator.metadata
    );
  }

  /**
   * Divides the asset amount by an asset ratio and returns a new AssetAmount.
   * @param {AssetRatio<T>} ar - The asset ratio to divide by.
   * @throws {Error} - Throws an error if the metadata is invalid or if the metadata does not match with the numerator's metadata.
   * @returns {AssetAmount} - A new AssetAmount representing the division result.
   */
  exchangeDivide(ar: AssetRatio<T>): AssetAmount {
    if (!this.metadata || !ar.denominator.metadata || !ar.numerator.metadata) {
      throw new Error(AssetAmount.INVALID_METADATA);
    }

    if (this.metadata !== ar.numerator.metadata) {
      throw new Error(AssetAmount.INVALID_DIVISION_ERROR);
    }

    return new AssetAmount<T>(
      (this.amount * ar.denominator.amount) / ar.numerator.amount,
      ar.denominator.metadata
    );
  }

  /**
   * Performs multiplication or division on the asset amount using an asset ratio, depending on the metadata.
   * @param {AssetRatio<T>} ar - The asset ratio for the operation.
   * @returns {AssetAmount} - A new AssetAmount representing the result of the operation.
   */
  exchangeAt(ar: AssetRatio<T>): AssetAmount {
    if (this.metadata === ar.denominator.metadata) {
      return this.exchangeMultiply(ar);
    } else {
      return this.exchangeDivide(ar);
    }
  }
}
