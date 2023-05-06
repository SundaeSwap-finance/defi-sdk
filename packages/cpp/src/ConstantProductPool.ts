import { Fraction, TFractionLike } from "@sundae/fraction";
import { sqrt } from "@sundae/bigint-math";

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
 * @param a the a amount
 * @param aReserve the pool's reserveA amount
 * @param bReserve the pool's reserveB amount
 * @param totalLp the pool's total minted lp currently
 * @returns the needed b, minted lp amounts, next total lp amount and share fraction
 */
export const addLiquidity = (
  a: bigint,
  aReserve: bigint,
  bReserve: bigint,
  totalLp: bigint
) => {
  const nextTotalLp = new Fraction(totalLp * (a + aReserve), aReserve).quotient;
  const lp = nextTotalLp - totalLp;
  const b = new Fraction(bReserve * a, aReserve).quotient;
  const share = getShare(lp, totalLp);
  return { nextTotalLp, lp, b, share };
};

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

  const feeDiff = BigInt(fee.denominator - fee.numerator);
  const output = new Fraction(
    outputReserve * input * feeDiff,
    inputReserve * fee.denominator + input * feeDiff
  );

  const safeOutput = roundOutputUp
    ? BigInt(Math.ceil(output.toNumber()))
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

  return { input, output, inputLpFee, nextInputReserve, nextOutputReserve, priceImpact };
};
