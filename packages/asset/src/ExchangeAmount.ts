import { AssetAmount } from "./AssetAmount";

export interface IExchangeAmountAsset {
  assetId: string;
  decimals: number;
}

export class ExchangeAssetRatio {
  constructor(
    public numerator: ExchangeAmount,
    public denominator: ExchangeAmount
  ) {}
}

export class ExchangeAmount extends AssetAmount {
  constructor(public amount: bigint, public asset: IExchangeAmountAsset) {
    super(amount, asset.decimals);
  }

  static INVALID_MULTIPLICATION_ERROR = "Cannot multiply incompatible assets.";
  static INVALID_DIVISION_ERROR = "Cannot divide incompatible assets.";

  multiply(ar: ExchangeAssetRatio): ExchangeAmount {
    if (this.asset !== ar.denominator.asset) {
      throw new Error(ExchangeAmount.INVALID_MULTIPLICATION_ERROR);
    }

    return new ExchangeAmount(
      (this.amount * ar.numerator.amount) / ar.denominator.amount,
      ar.numerator.asset
    );
  }

  divide(ar: ExchangeAssetRatio): ExchangeAmount {
    if (this.asset !== ar.numerator.asset) {
      throw new Error(ExchangeAmount.INVALID_DIVISION_ERROR);
    }

    return new ExchangeAmount(
      (this.amount * ar.denominator.amount) / ar.numerator.amount,
      ar.denominator.asset
    );
  }

  exchangeAt(ar: ExchangeAssetRatio): ExchangeAmount {
    if (this.asset === ar.denominator.asset) {
      return this.multiply(ar);
    } else {
      return this.divide(ar);
    }
  }
}
