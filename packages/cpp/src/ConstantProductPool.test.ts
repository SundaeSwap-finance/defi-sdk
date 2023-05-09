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
      // Ideal, 0% pool
      {
        input: 1n,
        inReserve: [1n, 1n],
        fee: zeroPct,
        out: 0n,
        outReserve: [2n, 1n],
        lpFee: 0n,
        impact: 0,
      },
      {
        input: 1n,
        inReserve: [1n, 2n],
        fee: zeroPct,
        out: 1n,
        outReserve: [2n, 1n],
        lpFee: 0n,
        impact: 0.5,
      },
      {
        input: 100n,
        inReserve: [1n, 2n],
        fee: zeroPct,
        out: 1n,
        outReserve: [101n, 1n],
        lpFee: 0n,
        impact: 0.995,
      },
      {
        input: 100n,
        inReserve: [1n, 100n],
        fee: zeroPct,
        out: 99n,
        outReserve: [101n, 1n],
        lpFee: 0n,
        impact: 0.9901,
      },
      {
        input: 100n,
        inReserve: [100n, 100n],
        fee: zeroPct,
        out: 50n,
        outReserve: [200n, 50n],
        lpFee: 0n,
        impact: 0.5,
      },
      {
        input: 50n,
        inReserve: [100n, 100n],
        fee: zeroPct,
        out: 33n,
        outReserve: [150n, 67n],
        lpFee: 0n,
        impact: 0.34,
      },

      // Simple boundary cases
      {
        input: 1n,
        inReserve: [1n, 1n],
        fee: threePct,
        out: 0n,
        outReserve: [2n, 1n],
        lpFee: 0n,
        impact: 0,
      },
      {
        input: 1n,
        inReserve: [1n, 2n],
        fee: threePct,
        out: 0n,
        outReserve: [2n, 2n],
        lpFee: 0n,
        impact: 0.5,
      },
      {
        input: 1n,
        inReserve: [1n, 3n],
        fee: threePct,
        out: 1n,
        outReserve: [2n, 2n],
        lpFee: 0n,
        impact: new Fraction(2, 3),
      },
      {
        input: 100n,
        inReserve: [1n, 2n],
        fee: threePct,
        out: 1n,
        outReserve: [101n, 1n],
        lpFee: 3n,
        impact: new Fraction(193, 194),
      },
      {
        input: 100n,
        inReserve: [1n, 100n],
        fee: threePct,
        out: 98n,
        outReserve: [101n, 2n],
        lpFee: 3n,
        impact: new Fraction(9602, 9700),
      },
      {
        input: 100n,
        inReserve: [100n, 100n],
        fee: threePct,
        out: 49n,
        outReserve: [200n, 51n],
        lpFee: 3n,
        impact: new Fraction(4800, 9700),
      },
      {
        input: 50n,
        inReserve: [100n, 100n],
        fee: threePct,
        out: 32n,
        outReserve: [150n, 68n],
        lpFee: 1n,
        impact: new Fraction(1700, 4900),
      },

      // Real world examples
      {
        input: 1291591603n,
        inReserve: [5753371381n, 672426600000n],
        fee: onePct,
        out: 122271016729n,
        outReserve: [7044962984n, 550155583271n],
        lpFee: 12915916n,
        impact: new Fraction(156344976337673367251n, 859815544712074200000n),
      },
    ] as { input: bigint; inReserve: TPair; fee: TFractionLike; out: bigint; outReserve: TPair; lpFee: bigint; impact: TFractionLike }[])(
      "%# input %d; pool %p; fee %d => output %o; nextPool %p; fee: %d; impact %d",
      ({ input, inReserve, fee, out, outReserve, lpFee, impact }) => {
        const actual = getSwapOutput(input, ...inReserve, fee);
        expect(actual.output).toBe(out);
        expect(actual.inputLpFee).toBe(lpFee);
        expect(actual.nextInputReserve).toBe(outReserve[0]);
        expect(actual.nextInputReserve).toBe(input + inReserve[0]);
        expect(actual.nextOutputReserve).toBe(outReserve[1]);
        expect(actual.nextOutputReserve + actual.output).toBe(inReserve[1]);
        expect(actual.priceImpact.eq(impact)).toBe(true);
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
      // Ideal 0% fee pool
      {
        input: 1n,
        inReserve: [1n, 2n],
        fee: zeroPct,
        impact: new Fraction(3n, 4n),
      },
      {
        input: 100n,
        inReserve: [1n, 2n],
        fee: zeroPct,
        impact: new Fraction(3n, 4n),
      },
      {
        input: 100n,
        inReserve: [1n, 100n],
        fee: zeroPct,
        impact: new Fraction(9901n, 10000n),
      },
      {
        input: 100n,
        inReserve: [100n, 100n],
        fee: zeroPct,
        impact: new Fraction(5100n, 10100n),
      },
      {
        input: 50n,
        inReserve: [100n, 100n],
        fee: zeroPct,
        impact: new Fraction(1700n, 5000n),
      },

      // Simple boundary cases
      {
        input: 1n,
        inReserve: [1n, 3n],
        fee: threePct,
        impact: new Fraction(2n, 3n),
      },
      {
        input: 100n,
        inReserve: [1n, 2n],
        fee: threePct,
        impact: new Fraction(3n, 4n),
      },
      {
        input: 100n,
        inReserve: [1n, 100n],
        fee: threePct,
        impact: new Fraction(4902n, 5000n),
      },
      {
        input: 100n,
        inReserve: [100n, 100n],
        fee: threePct,
        impact: new Fraction(4800n, 9700n),
      },
      {
        input: 50n,
        inReserve: [100n, 100n],
        fee: threePct,
        impact: new Fraction(1600n, 4800n),
      },

      // Real world examples
      {
        input: 1291591603n,
        inReserve: [5753371381n, 672426600000n],
        fee: onePct,
        impact: new Fraction(156344976337673367251n, 859815544712074200000n),
      },
    ] as { input: bigint; inReserve: TPair; fee: TFractionLike; impact: TFractionLike }[])(
      "%# input %d; pool %p; fee %d; impact %d",
      ({ input, inReserve, fee, impact }) => {
        const outcome = getSwapOutput(input, ...inReserve, fee);
        const actual = getSwapInput(outcome.output, ...inReserve, fee);
        const outcomeForActual = getSwapOutput(actual.input, ...inReserve, fee);
        expect(outcome.output).toBe(outcomeForActual.output);
        expect(actual.inputLpFee).toBe(outcomeForActual.inputLpFee);
        expect(actual.nextInputReserve).toBe(outcomeForActual.nextInputReserve);
        expect(actual.nextOutputReserve).toBe(
          outcomeForActual.nextOutputReserve
        );
        expect(actual.priceImpact).toEqual(outcomeForActual.priceImpact);
        expect(actual.priceImpact.eq(impact)).toBe(true);
      }
    );
  });
});
