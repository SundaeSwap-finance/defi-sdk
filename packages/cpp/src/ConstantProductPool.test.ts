import { Fraction, TFractionLike } from "@sundae/fraction";
import { getSwapOutput, getSwapInput, TPair } from "./ConstantProductPool";

describe("getSwapOutput", () => {
  const threePct = new Fraction(3, 100);
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
      [1n, [1n, 1n], zeroPct, 0n, [2n, 1n], 0n],
      [1n, [1n, 2n], zeroPct, 1n, [2n, 1n], 0n],
      [100n, [1n, 2n], zeroPct, 1n, [101n, 1n], 0n],
      [100n, [1n, 100n], zeroPct, 99n, [101n, 1n], 0n],
      [100n, [100n, 100n], zeroPct, 50n, [200n, 50n], 0n],
      [50n, [100n, 100n], zeroPct, 33n, [150n, 67n], 0n],

      [1n, [1n, 1n], threePct, 0n, [2n, 1n], 0n],
      [1n, [1n, 2n], threePct, 0n, [2n, 2n], 0n],
      [1n, [1n, 3n], threePct, 1n, [2n, 2n], 0n],
      [100n, [1n, 2n], threePct, 1n, [101n, 1n], 3n],
      [100n, [1n, 100n], threePct, 98n, [101n, 2n], 3n],
      [100n, [100n, 100n], threePct, 49n, [200n, 51n], 3n],
      [50n, [100n, 100n], threePct, 32n, [150n, 68n], 1n],
    ] as [bigint, TPair, TFractionLike, bigint, TPair, bigint][])(
      "%# input %d; pool %p; fee %d => output %o; nextPool %p; fee: %d",
      (input, pool, fee, output, nextPool, lpFee) => {
        const actual = getSwapOutput(input, ...pool, fee);
        expect(actual.output).toBe(output);
        expect(actual.inputLpFee).toBe(lpFee);
        expect(actual.nextInputReserve).toBe(nextPool[0]);
        expect(actual.nextInputReserve).toBe(input + pool[0]);
        expect(actual.nextOutputReserve).toBe(nextPool[1]);
        expect(actual.nextOutputReserve + actual.output).toBe(pool[1]);
      }
    );
  });
});

describe("getSwapInput", () => {
  const threePct = new Fraction(3, 100);
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
      [1n, [1n, 2n], zeroPct],
      [100n, [1n, 2n], zeroPct],
      [100n, [1n, 100n], zeroPct],
      [100n, [100n, 100n], zeroPct],
      [50n, [100n, 100n], zeroPct],

      [1n, [1n, 3n], threePct],
      [100n, [1n, 2n], threePct],
      [100n, [1n, 100n], threePct],
      [100n, [100n, 100n], threePct],
      [50n, [100n, 100n], threePct],
    ] as [bigint, TPair, TFractionLike][])(
      "%# input %d; pool %p; fee %d",
      (input, pool, fee) => {
        const outcome = getSwapOutput(input, ...pool, fee);
        const actual = getSwapInput(outcome.output, ...pool, fee);
        const outcomeForActual = getSwapOutput(actual.input, ...pool, fee);
        expect(outcome.output).toBe(outcomeForActual.output);
        expect(actual.inputLpFee).toBe(outcomeForActual.inputLpFee);
        expect(actual.nextInputReserve).toBe(outcomeForActual.nextInputReserve);
        expect(actual.nextOutputReserve).toBe(
          outcomeForActual.nextOutputReserve
        );
      }
    );
  });
});
