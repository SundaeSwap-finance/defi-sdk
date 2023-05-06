import { Fraction, TFractionLike } from "@sundae/fraction";
import { getSwapOutput, getSwapInput, TPair } from "./ConstantProductPool";

describe("getSwapOutput", () => {
  const threePct = new Fraction(3, 100);
  const onePct = new Fraction(1, 100);
  const zeroPct = Fraction.ZERO;

  test("throws if any of the arguments are negative", () => {
    expect(() => getSwapOutput(-1n, 10n, 10n, Fraction.ZERO)).toThrow();
    expect(() => getSwapOutput(1n, -10n, 10n, Fraction.ZERO)).toThrow();
    expect(() => getSwapOutput(1n, 10n, -10n, Fraction.ZERO)).toThrow();
    expect(() =>
      getSwapOutput(1n, 1n, 1n, Fraction.asFraction(-0.1))
    ).toThrow();
  });

  test("throws if fee is greater than or equal 1", () => {
    expect(() => getSwapOutput(1n, 10n, 10n, Fraction.asFraction(1))).toThrow();
    expect(() =>
      getSwapOutput(1n, 10n, 10n, Fraction.asFraction(1.132))
    ).toThrow();
  });

  test("rounds up for non-fractional assets", () => {
    expect(getSwapOutput(83n, 10000n, 500n, threePct).output).toEqual(3n);
    expect(getSwapOutput(83n, 10000n, 500n, threePct, true).output).toEqual(4n);
  });

  describe("correct output, next state and fee collected", () => {
    test.each([
      // Ideal pool
      [1n, [1n, 1n], zeroPct, 0n, [2n, 1n], 0n, 0],
      [1n, [1n, 2n], zeroPct, 1n, [2n, 1n], 0n, 0.5],
      [100n, [1n, 2n], zeroPct, 1n, [101n, 1n], 0n, 0.995],
      [100n, [1n, 100n], zeroPct, 99n, [101n, 1n], 0n, 0.9901],
      [100n, [100n, 100n], zeroPct, 50n, [200n, 50n], 0n, 0.5],
      [50n, [100n, 100n], zeroPct, 33n, [150n, 67n], 0n, 0.34],

      // With fee
      [1n, [1n, 1n], threePct, 0n, [2n, 1n], 0n, 0],
      [1n, [1n, 2n], threePct, 0n, [2n, 2n], 0n, 0.5],
      [1n, [1n, 3n], threePct, 1n, [2n, 2n], 0n, new Fraction(2, 3)],
      [100n, [1n, 2n], threePct, 1n, [101n, 1n], 3n, new Fraction(193, 194)],
      [100n, [1n, 100n], threePct, 98n, [101n, 2n], 3n, new Fraction(9602, 9700)],
      [100n, [100n, 100n], threePct, 49n, [200n, 51n], 3n, new Fraction(4800, 9700)],
      [50n, [100n, 100n], threePct, 32n, [150n, 68n], 1n, new Fraction(1700, 4900)],
      
      // Real world examples
      [1291591603n, [5753371381n, 672426600000n], onePct, 122271016729n, [7044962984n, 550155583271n], 12915916n, new Fraction(156344976337673367251n, 859815544712074200000n)],
    ] as [bigint, TPair, TFractionLike, bigint, TPair, bigint, TFractionLike][])(
      "%# input %d; pool %p; fee %d => output %o; nextPool %p; fee: %d; impact %d",
      (input, pool, fee, output, nextPool, lpFee, priceImpact) => {
        const actual = getSwapOutput(input, ...pool, fee);
        expect(actual.output).toBe(output);
        expect(actual.inputLpFee).toBe(lpFee);
        expect(actual.nextInputReserve).toBe(nextPool[0]);
        expect(actual.nextInputReserve).toBe(input + pool[0]);
        expect(actual.nextOutputReserve).toBe(nextPool[1]);
        expect(actual.nextOutputReserve + actual.output).toBe(pool[1]);
        expect(actual.priceImpact.eq(priceImpact)).toBe(true);
      }
    );
  });
});

describe("getSwapInput", () => {
  const threePct = new Fraction(3, 100);
  const onePct = new Fraction(1, 100);
  const zeroPct = Fraction.ZERO;

  test("throws if any of the arguments are negative", () => {
    expect(() => getSwapInput(-1n, 10n, 10n, Fraction.ZERO)).toThrow();
    expect(() => getSwapInput(1n, -10n, 10n, Fraction.ZERO)).toThrow();
    expect(() => getSwapInput(1n, 10n, -10n, Fraction.ZERO)).toThrow();
    expect(() =>
      getSwapInput(1n, 10n, 10n, Fraction.asFraction(-0.1))
    ).toThrow();
  });

  test("throws if fee is greater than or equal 1", () => {
    expect(() => getSwapInput(1n, 10n, 10n, Fraction.asFraction(1))).toThrow();
    expect(() =>
      getSwapInput(1n, 10n, 10n, Fraction.asFraction(1.132))
    ).toThrow();
  });

  test("throws if output is greater than or equal to output reserve", () => {
    expect(() =>
      getSwapInput(10n, 10n, 10n, Fraction.asFraction(0.1))
    ).toThrow();
    expect(() => getSwapInput(1n, 1n, 1n, Fraction.asFraction(0.1))).toThrow();
    expect(() => getSwapInput(10n, 1n, 1n, Fraction.asFraction(0.1))).toThrow();
  });

  describe("correct input, next state and fee collected", () => {
    test.each([
      [1n, [1n, 2n], zeroPct, new Fraction(3n, 4n)],
      [100n, [1n, 2n], zeroPct, new Fraction(3n, 4n)],
      [100n, [1n, 100n], zeroPct, new Fraction(9901n, 10000n)],
      [100n, [100n, 100n], zeroPct, new Fraction(5100n, 10100n)],
      [50n, [100n, 100n], zeroPct, new Fraction(1700n, 5000n)],

      [1n, [1n, 3n], threePct, new Fraction(2n, 3n)],
      [100n, [1n, 2n], threePct, new Fraction(3n, 4n)],
      [100n, [1n, 100n], threePct, new Fraction(4902n, 5000n)],
      [100n, [100n, 100n], threePct, new Fraction(4800n, 9700n)],
      [50n, [100n, 100n], threePct, new Fraction(1600n, 4800n)],

      // Real world examples
      [1291591603n, [5753371381n, 672426600000n], onePct, new Fraction(156344976337673367251n, 859815544712074200000n)],
    ] as [bigint, TPair, TFractionLike, TFractionLike][])(
      "%# input %d; pool %p; fee %d; impact %d",
      (input, pool, fee, priceImpact) => {
        const outcome = getSwapOutput(input, ...pool, fee);
        const actual = getSwapInput(outcome.output, ...pool, fee);
        const outcomeForActual = getSwapOutput(actual.input, ...pool, fee);
        expect(outcome.output).toBe(outcomeForActual.output);
        expect(actual.inputLpFee).toBe(outcomeForActual.inputLpFee);
        expect(actual.nextInputReserve).toBe(outcomeForActual.nextInputReserve);
        expect(actual.nextOutputReserve).toBe(
          outcomeForActual.nextOutputReserve
        );
        expect(actual.priceImpact).toEqual(outcomeForActual.priceImpact);
        expect(actual.priceImpact.eq(priceImpact)).toBe(true);
      }
    );
  });
});
