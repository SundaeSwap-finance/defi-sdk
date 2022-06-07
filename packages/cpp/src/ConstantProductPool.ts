import { Fraction, TFractionLike } from "@sundae/fraction";
import { sqrt } from "@sundae/bigint-math";

export type TPair = [bigint, bigint];
// export type TPool = [bigint, bigint, TFractionLike];

export const getLp = (a: bigint, b: bigint) => sqrt(a * b);

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
  fee: TFractionLike
): TSwapOutcome => {
  if (input <= 0 || inputReserve <= 0 || outputReserve <= 0)
    throw new Error("Input and reserves must be positive");

  fee = Fraction.asFraction(fee);
  if (fee.lt(Fraction.ZERO) || fee.gte(Fraction.ONE))
    throw new Error("fee must be [0,1)");

  const feeDiff = fee.denominator - fee.numerator;
  const output = new Fraction(
    outputReserve * input * feeDiff,
    inputReserve * fee.denominator + input * feeDiff
  ).quotient;

  const inputLpFee = new Fraction(input * fee.numerator, fee.denominator)
    .quotient;
  const nextInputReserve = inputReserve + input;
  const nextOutputReserve = outputReserve - output;
  return { input, output, inputLpFee, nextInputReserve, nextOutputReserve };
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

  const feeDiff = fee.denominator - fee.numerator;
  const input =
    new Fraction(
      inputReserve * output * fee.denominator,
      (outputReserve - output) * feeDiff
    ).quotient + 1n;

  const inputLpFee = new Fraction(input * fee.numerator, fee.denominator)
    .quotient;
  const nextInputReserve = inputReserve + input;
  const nextOutputReserve = outputReserve - output;
  return { input, output, inputLpFee, nextInputReserve, nextOutputReserve };
};
