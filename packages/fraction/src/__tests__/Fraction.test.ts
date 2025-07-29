import { describe, test, expect } from "bun:test";
import { Fraction } from "../Fraction.js";

describe("Fraction", () => {
  test(".constructor()", () => {
    expect(new Fraction(42, 994)).toMatchObject({
      numerator: 42n,
      denominator: 994n,
    });
    expect(new Fraction(2.0, "55")).toMatchObject({
      numerator: 2n,
      denominator: 55n,
    });
    expect(
      new Fraction("442", "9940000000000000000000000000000123123123"),
    ).toMatchObject({
      numerator: 442n,
      denominator: 9940000000000000000000000000000123123123n,
    });
  });

  test(".invert", () => {
    expect(new Fraction(1, 25).invert()).toMatchObject({
      numerator: 25n,
      denominator: 1n,
    });
  });

  test(".getQuotient()", () => {
    expect(new Fraction(1, 25).getQuotient()).toBe(0n);
    expect(new Fraction(52, 25).getQuotient()).toBe(2n);
  });

  test(".getRemainder()", () => {
    expect(new Fraction(1, 25).getRemainder()).toEqual(new Fraction(1, 25));
    expect(new Fraction(52, 25).getRemainder()).toEqual(new Fraction(2, 25));
  });

  test(".toString()", () => {
    expect(new Fraction(1, 25).toString()).toBe("0.04");
    expect(new Fraction(-123090, 1000000).toString()).toBe("-0.12309");
    expect(new Fraction(1_000_000 * 25 + 1, 25).toString()).toBe("1000000.04");
    expect(Fraction.ZERO.toString()).toBe("0");
    expect(Fraction.ONE.toString()).toBe("1");
    expect(Fraction.HUNDRED.toString()).toBe("100");
  });

  test(".toNumber()", () => {
    expect(new Fraction(1, 25).toNumber()).toBe(0.04);
    expect(new Fraction(-123090, 1000000).toNumber()).toBe(-0.12309);
    expect(new Fraction(1, 3).toNumber(2)).toBe(0.33);
  });

  test(".parseString()", () => {
    expect(Fraction.parseString("0.04").eq(new Fraction(1, 25))).toBe(true);
    expect(
      Fraction.parseString("1000000.00004").eq(
        new Fraction(1_000_000 * 25_000 + 1, 25_000),
      ),
    ).toBe(true);
    expect(Fraction.parseString("0").eq(Fraction.ZERO)).toBe(true);
    expect(Fraction.parseString("1").eq(Fraction.ONE)).toBe(true);
    expect(Fraction.parseString("1000").eq(Fraction.THOUSAND)).toBe(true);
    expect(Fraction.parseString("1e3").eq(Fraction.THOUSAND)).toBe(true);
    expect(Fraction.parseString("1.3e3").eq(new Fraction(1300, 1))).toBe(true);
    expect(Fraction.parseString("1.3e-3").eq(new Fraction(13, 10000))).toBe(
      true,
    );
    expect(
      Fraction.parseString("1.890094141e-8").eq(
        new Fraction(1890094141n, 100000000000000000n),
      ),
    ).toBe(true);
  });

  test(".asFraction", () => {
    expect(Fraction.asFraction(-0.3).eq(new Fraction(3, -10))).toBe(true);
    expect(Fraction.asFraction("-0.3")).toEqual(new Fraction(-3, 10));
    expect(Fraction.asFraction(0.1)).toEqual(new Fraction(1, 10));
    expect(Fraction.asFraction(1231n)).toEqual(new Fraction(1231));

    expect(
      Fraction.asFraction(`0.${"0".repeat(Fraction.MAX_DECIMALS)}1`).eq(
        Fraction.ZERO,
      ),
    );
    expect(
      Fraction.asFraction(`0.${"0".repeat(Fraction.MAX_DECIMALS - 1)}1`).eq(
        new Fraction(1, 10 ** Fraction.MAX_DECIMALS),
      ),
    );
  });
});
