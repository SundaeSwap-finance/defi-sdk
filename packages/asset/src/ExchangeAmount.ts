import { AssetAmount } from "./AssetAmount";

/**
 * Minimal interface representing an exchangeable asset in the application.
 * @interface
 * @property {string} assetId - The unique identifier for the asset.
 * @property {number} decimals - The number of decimals the asset supports.
 */
export interface IExchangeAmountAsset {
  assetId: string;
  decimals: number;
}

/**
 * Class representing the ratio between two exchangeable assets.
 * @class
 * @property {ExchangeAmount} numerator - The ExchangeAmount that represents the numerator of the ratio.
 * @property {ExchangeAmount} denominator - The ExchangeAmount that represents the denominator of the ratio.
 */
export class ExchangeAssetRatio {
  /**
   * Creates an instance of ExchangeAssetRatio.
   * @param {ExchangeAmount} numerator - The numerator of the ratio.
   * @param {ExchangeAmount} denominator - The denominator of the ratio.
   * eslint-disable-next-line no-useless-constructor
   */
  constructor(
    public numerator: ExchangeAmount,
    public denominator: ExchangeAmount
  ) {}
}

/**
 * Class representing an amount of an exchangeable asset.
 * @class
 * @extends AssetAmount
 * @property {bigint} amount - The diminutive amount of the asset. For example, if 10 ADA, then it is represented as 10,000,000 lovelace.
 * @property {IExchangeAmountAsset} asset - The exchangeable asset.
 */
export class ExchangeAmount extends AssetAmount {
  /**
   * Creates an instance of ExchangeAmount.
   * @param {bigint} amount - The amount of the asset in its diminutive unit.
   * @param {IExchangeAmountAsset} asset - The exchangeable asset.
   */
  constructor(public amount: bigint, public asset: IExchangeAmountAsset) {
    super(amount, asset.decimals);
  }

  static INVALID_MULTIPLICATION_ERROR = "Cannot multiply incompatible assets.";
  static INVALID_DIVISION_ERROR = "Cannot divide incompatible assets.";

  /**
   * Multiplies the amount with an ExchangeAssetRatio.
   * @param {ExchangeAssetRatio} ar - The ratio to multiply with.
   * @throws Will throw an error if the asset and the denominator of the ratio are not the same.
   * @returns {ExchangeAmount} The result of the multiplication as a new ExchangeAmount instance.
   */
  multiply(ar: ExchangeAssetRatio): ExchangeAmount {
    if (this.asset !== ar.denominator.asset) {
      throw new Error(ExchangeAmount.INVALID_MULTIPLICATION_ERROR);
    }

    return new ExchangeAmount(
      (this.amount * ar.numerator.amount) / ar.denominator.amount,
      ar.numerator.asset
    );
  }

  /**
   * Divides the amount with an ExchangeAssetRatio.
   * @param {ExchangeAssetRatio} ar - The ratio to divide with.
   * @throws Will throw an error if the asset and the numerator of the ratio are not the same.
   * @returns {ExchangeAmount} The result of the division as a new ExchangeAmount instance.
   */
  divide(ar: ExchangeAssetRatio): ExchangeAmount {
    if (this.asset !== ar.numerator.asset) {
      throw new Error(ExchangeAmount.INVALID_DIVISION_ERROR);
    }

    return new ExchangeAmount(
      (this.amount * ar.denominator.amount) / ar.numerator.amount,
      ar.denominator.asset
    );
  }

  /**
   * Converts the amount of the asset at a certain ExchangeAssetRatio.
   * If the asset is the same as the denominator of the ratio, it multiplies the amount.
   * Otherwise, it divides the amount.
   * @param {ExchangeAssetRatio} ar - The ratio to exchange at.
   * @returns {ExchangeAmount} The result of the conversion as a new ExchangeAmount instance.
   */
  exchangeAt(ar: ExchangeAssetRatio): ExchangeAmount {
    if (this.asset === ar.denominator.asset) {
      return this.multiply(ar);
    } else {
      return this.divide(ar);
    }
  }
}
