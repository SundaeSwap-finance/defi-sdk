import { AssetAmount } from "@sundaeswap/asset";
import { Fraction, TFractionLike } from "@sundaeswap/fraction";
import { sqrt } from "@sundaeswap/bigint-math";

export type TRatioDirection = "A_PER_B" | "B_PER_A";

export interface IRatioCalculationAsset {
  assetId: string;
  quantity: bigint;
  decimals: number;
}

export interface IRatioCalculationResult {
  calculatedAmount: AssetAmount;
  ratioAsFraction: Fraction;
  display: string;
  isDivisible: boolean;
}

export type TPair = [bigint, bigint];

/**
 * Get the lp token amount for a, b
 * @param a tokenA amount
 * @param b tokenB amount
 * @returns the minted lp token amount
 */
export const getLp = (a: bigint, b: bigint) => sqrt(a * b);

/**
 * Get the share ratio as Fraction
 * @param lp
 * @param totalLp
 * @returns
 */
export const getShare = (lp: bigint, totalLp: bigint) =>
  new Fraction(lp, totalLp);

/**
 * Calculate the Add (Mixed-Deposit) Liquidity parameters
 *
 * @param {bigint} a - The amount of token A to add.
 * @param {bigint} aReserve - The current reserve of token A in the pool.
 * @param {bigint} bReserve - The current reserve of token B in the pool.
 * @param {bigint} totalLp - The total liquidity in the pool before adding.
 * @throws {Error} If the provided 'a' asset is not enough to equal at least 1 of the 'b' asset.
 * @returns {Object} An object containing:
 *   - nextTotalLp: The total liquidity in the pool after adding.
 *   - lp: The liquidity provided by the 'a' token. (Deprecated)
 *   - generatedLp: The liquidity provided by the 'a' token.
 *   - b: The amount of token 'b' that matches the provided 'a' token. (Deprecated)
 *   - requiredB: The amount of token 'b' that matches the provided 'a' token.
 *   - share: The share of the pool after adding 'a'. (Deprecated)
 *   - shareAfterDeposit: The share of the pool after adding 'a'.
 */
export const calculateLiquidity = (
  a: bigint,
  aReserve: bigint,
  bReserve: bigint,
  totalLp: bigint
) => {
  const nextTotalLp = new Fraction(totalLp * (a + aReserve), aReserve).quotient;
  const lp = nextTotalLp - totalLp;
  const b = new Fraction(bReserve * a, aReserve);
  const share = getShare(lp, nextTotalLp);

  if (b.quotient === 0n) {
    throw new Error(
      "The provided a asset is not enough to equal at least 1 of the b asset."
    );
  }

  return {
    nextTotalLp,
    /** @deprecated */
    lp,
    generatedLp: lp,
    /** @deprecated */
    b: b.quotient,
    requiredB: b.quotient,
    /** @deprecated */
    share,
    shareAfterDeposit: share,
  };
};

/**
 * @deprecated
 *
 * Use {@link calculateLiquidity} instead.
 */
export const addLiquidity = calculateLiquidity;

/**
 * Get the token amounts the given lp represents
 * @param lp the lp amount
 * @param aReserve the pool's reserveA amount
 * @param bReserve the pool's reserveB amount
 * @param totalLp the pool's total minted lp currently
 * @returns [a, b] token amounts
 */
export const getTokensForLp = (
  lp: bigint,
  aReserve: bigint,
  bReserve: bigint,
  totalLp: bigint
): TPair => [
  new Fraction(lp * aReserve, totalLp).quotient,
  new Fraction(lp * bReserve, totalLp).quotient,
];

export type TSwapOutcome = {
  input: bigint;
  output: bigint;
  inputLpFee: bigint;
  nextInputReserve: bigint;
  nextOutputReserve: bigint;
  priceImpact: Fraction;
};

/**
 * Calculate swap outcome for a given input and pool parameters (input tokens, output tokens, fee).
 * Throws if
 *  - any of the arguments are negative
 *  - fee is greater than or equal 1
 *
 * @param input The given amount of tokens to be swapped
 * @param inputReserve The amount of tokens in the input reserve
 * @param outputReserve The amount of tokens in the output reserve
 * @param fractionFee The liquidity provider fee
 * @returns The swap details
 */
export const getSwapOutput = (
  input: bigint,
  inputReserve: bigint,
  outputReserve: bigint,
  fee: TFractionLike,
  roundOutputUp?: boolean
): TSwapOutcome => {
  if (input <= 0 || inputReserve <= 0 || outputReserve <= 0)
    throw new Error("Input and reserves must be positive");

  fee = Fraction.asFraction(fee);
  if (fee.lt(Fraction.ZERO) || fee.gte(Fraction.ONE))
    throw new Error("fee must be [0,1)");

  const feeDiff = fee.denominator - fee.numerator;
  const outputNumerator = outputReserve * input * feeDiff;
  const outputDenominator = inputReserve * fee.denominator + input * feeDiff;
  const output = new Fraction(outputNumerator, outputDenominator);

  const safeOutput = roundOutputUp
    ? (outputNumerator + outputDenominator - 1n) / outputDenominator
    : output.quotient;

  const inputLpFee = new Fraction(input * fee.numerator, fee.denominator)
    .quotient;
  const nextInputReserve = inputReserve + input;
  const nextOutputReserve = outputReserve - safeOutput;

  // PRICEIMPACT: "priceImpact" is slightly misleadingly named in the industry as a whole
  // just by it's name, it would imply that it's the percentage difference between
  // the current price and the price after the swap, but it's actually the percentage
  // difference between the real price of your swap, and the price implied by the current
  // reserves; We got this wrong in v1, but this aligns it with the industry standard
  // Source: https://dailydefi.org/articles/price-impact-and-how-to-calculate/
  const amountInLessFee = input - inputLpFee;
  const idealPrice = new Fraction(inputReserve, outputReserve);
  const actualPrice = new Fraction(amountInLessFee, safeOutput);
  const priceImpact = Fraction.ONE.subtract(idealPrice.divide(actualPrice));
  return {
    input,
    output: safeOutput,
    inputLpFee,
    nextInputReserve,
    nextOutputReserve,
    priceImpact,
  };
};

/**
 * Calculate input required for a swap outcome for a given output and pool parameters (input tokens, output tokens, fee).
 * Throws if
 *  - any of the arguments are negative
 *  - fee is greater than or equal 1
 *  - output is greater than or equal to output reserve
 *
 * @param output
 * @param inputReserve
 * @param outputReserve
 * @param fee
 * @returns The swap details
 */
export const getSwapInput = (
  output: bigint,
  inputReserve: bigint,
  outputReserve: bigint,
  fee: TFractionLike
): TSwapOutcome => {
  if (output <= 0 || inputReserve <= 0 || outputReserve <= 0)
    throw new Error("Output and reserves must be positive");

  if (output >= outputReserve)
    throw new Error("Output must be less than output reserve");

  fee = Fraction.asFraction(fee);
  if (fee.lt(Fraction.ZERO) || fee.gte(Fraction.ONE))
    throw new Error("fee must be [0,1)");

  const feeDiff = BigInt(fee.denominator - fee.numerator);
  const input =
    new Fraction(
      inputReserve * output * fee.denominator,
      (outputReserve - output) * feeDiff
    ).quotient + 1n;

  const inputLpFee = new Fraction(input * fee.numerator, fee.denominator)
    .quotient;
  const nextInputReserve = inputReserve + input;
  const nextOutputReserve = outputReserve - output;

  // See PRICEIMPACT
  const amountInLessFee = input - inputLpFee;
  const idealPrice = new Fraction(inputReserve, outputReserve);
  const actualPrice = new Fraction(amountInLessFee, output);
  const priceImpact = Fraction.ONE.subtract(idealPrice.divide(actualPrice));

  return {
    input,
    output,
    inputLpFee,
    nextInputReserve,
    nextOutputReserve,
    priceImpact,
  };
};

/**
 * Calculates the ratio between two values.
 *
 * @function
 * @param {TFractionLike} firstValue - The first value for the ratio calculation.
 * @param {TFractionLike} secondValue - The second value for the ratio calculation.
 * @returns {string|null} The ratio of the first value to the second value, expressed as a string in base 10. If either of the inputs is zero or negative, or if either input is missing, the function returns null.
 * @throws {Error} Will throw an error if the inputs are not valid for the Fraction class's `asFraction` method.
 */
export const getAssetsRatio = (
  firstValue: TFractionLike,
  secondValue: TFractionLike
) => {
  const first = Fraction.asFraction(firstValue ?? 0);
  const second = Fraction.asFraction(secondValue ?? 0);

  if (!first.greaterThan(0) || !second.greaterThan(0)) {
    return null;
  }

  return first.divide(second).toString(10);
};

/**
 * Calculates the swap ratio between two assets and returns an AssetAmount instance representing this ratio.
 *
 * The assets are first sorted lexicographically by their assetId to ensure any calculation will match
 * pool ratios (which are also sorted lexicographically when created). The direction of the swap determines the calculation.
 * For 'A_PER_B', it calculates how much of the lexicographically first asset (A) is obtained for each unit of the
 * lexicographically second asset (B). For 'B_PER_A', it calculates how much of the lexicographically second asset (B)
 * is obtained for each unit of the lexicographically first asset (A).
 *
 * The returned AssetAmount is represented in the decimal format of the asset that is being received in the swap operation.
 * In 'A_PER_B' direction, the lexicographically first asset (A) is received, so the AssetAmount will be in the decimal format
 * of Asset A. In 'B_PER_A' direction, the lexicographically second asset (B) is received, so the AssetAmount will be in the decimal format of Asset B.
 *
 * @function
 * @param {TRatioDirection} direction - The direction of the swap: 'A_PER_B' means the first asset lexicographically is received and the second is given, 'B_PER_A' means the second asset lexicographically is received and the first is given.
 * @param {[IRatioCalculationAsset, IRatioCalculationAsset]} assets - An array of two assets involved in the swap. The order of the assets in this array does not matter as they will be sorted lexicographically by their assetId inside the function.
 *
 * @returns {TSwapRatio} The calculated swap ratio in different representations.
 *
 * @example
 *
 * ```ts
 * const asset1 = { quantity: 100, decimals: 0, assetId: 'B' };
 * const asset2 = { quantity: 2000000, decimals: 6, assetId: 'A' };
 * const amount = getSwapRatio('A_PER_B', [asset1, asset2]);
 * const sameAmount = getSwapRatio('A_PER_B', [asset2, asset1]);
 * console.log(amount.ratioAsFraction); // Returns a Fraction class of the ratio.
 * console.log(sameAmount.ratioAsFraction); // Same as above.
 * ```
 */
export function getSwapRatio(
  direction: TRatioDirection,
  assets: [IRatioCalculationAsset, IRatioCalculationAsset]
): IRatioCalculationResult {
  let calculatedAmount: AssetAmount;
  let rawRatio: string;
  const [firstAsset, secondAsset] = assets.sort((a, b) =>
    a.assetId.localeCompare(b.assetId)
  );

  if (direction === "A_PER_B") {
    rawRatio = getAssetsRatio(firstAsset.quantity, secondAsset.quantity);
    calculatedAmount = AssetAmount.fromValue(
      Number(rawRatio) * 10 ** (secondAsset.decimals - firstAsset.decimals),
      firstAsset.decimals
    );
  } else {
    rawRatio = getAssetsRatio(secondAsset.quantity, firstAsset.quantity);
    calculatedAmount = AssetAmount.fromValue(
      Number(rawRatio) * 10 ** (firstAsset.decimals - secondAsset.decimals),
      secondAsset.decimals
    );
  }

  return {
    calculatedAmount: calculatedAmount,
    display: calculatedAmount.value.toString(),
    ratioAsFraction: Fraction.asFraction(rawRatio),
    isDivisible: calculatedAmount.decimals > 0,
  };
}
