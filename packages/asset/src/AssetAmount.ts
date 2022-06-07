import { Fraction, TIntegerLike } from "@sundae/fraction";
import { IFungibleAsset, IHasDecimals } from "./Asset";

export class AssetAmount implements IFungibleAsset, IHasDecimals {
  readonly decimals: number;
  readonly amount: bigint;
  readonly value: Fraction;

  static toValue(amount: bigint, decimals = 0): Fraction {
    return new Fraction(amount, 10n ** BigInt(decimals));
  }

  constructor(amount: TIntegerLike, decimals?: number) {
    this.amount = BigInt(amount);
    this.decimals = decimals ?? 0;
    this.value = AssetAmount.toValue(this.amount, this.decimals);
  }

  add(rhs: AssetAmount): AssetAmount {
    return new AssetAmount(this.amount + rhs.amount, this.decimals);
  }

  sub(rhs: AssetAmount): AssetAmount {
    return new AssetAmount(this.amount - rhs.amount, this.decimals);
  }
}
