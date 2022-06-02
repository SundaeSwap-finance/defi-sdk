export type TFractionLike = number | string | bigint;
export type TIntegerLike = number | string | bigint;

export enum FractionError {
  DivisionByZero = "DivisionByZero",
  // InvalidDecimals = "InvalidDecimals",
}

/**
 * Represents a rational number.
 * Provides basic arithmetic operations, and parsing/formatting.
 * TODO localized formatting
 */
export class Fraction {
  static readonly MAX_DECIMALS = 30;
  static readonly ZERO = new Fraction(0);
  static readonly ONE = new Fraction(1);
  static readonly HUNDRED = new Fraction(100);
  static readonly THOUSAND = new Fraction(1000);

  static compare(a: Fraction, b: Fraction): number {
    if (a.greaterThan(b)) return 1;
    if (a.lessThan(b)) return -1;
    return 0;
  }

  static asFraction(fraction: Fraction | TFractionLike): Fraction {
    return fraction instanceof Fraction
      ? fraction
      : Fraction.parseString(fraction.toString());
  }

  // static fromLocaleString(numStr: string, locale?: string): Fraction {
  //   const { decimalSeparator, groupSeparator } = getLocaleFormatOptions(locale);
  //   const [integerPart, fractionalPart] = numStr.split(decimalSeparator);
  //   const quotient = BigInt(integerPart.split(groupSeparator).join(""));
  //   if (!fractionalPart?.length) return new Fraction(quotient);
  //   const denominator = 10n ** BigInt(fractionalPart.length);
  //   return new Fraction(
  //     quotient * denominator + BigInt(fractionalPart),
  //     denominator
  //   );
  // }

  static parseString(fractionString: string): Fraction {
    let [integerPart, fractionalPart] = fractionString.split(".");
    if (!fractionalPart?.length) return new Fraction(integerPart);
    fractionalPart = fractionalPart.slice(
      0,
      Math.min(fractionalPart.length, Fraction.MAX_DECIMALS)
    );

    const denominator = 10n ** BigInt(fractionalPart.length);
    return new Fraction(
      BigInt(integerPart) * denominator + BigInt(fractionalPart),
      denominator
    );
  }
  readonly numerator: bigint;
  readonly denominator: bigint;

  constructor(numerator: TIntegerLike, denominator?: TIntegerLike) {
    this.numerator = BigInt(numerator);
    this.denominator = BigInt(denominator || 1n);
    if (this.denominator === 0n) throw new Error(FractionError.DivisionByZero);
  }

  abs(): Fraction {
    return this.lessThan(Fraction.ZERO) ? this.multiply(-1) : this;
  }

  add(rhs: Fraction | TFractionLike): Fraction {
    rhs = Fraction.asFraction(rhs);
    return new Fraction(
      this.numerator * rhs.denominator + rhs.numerator * this.denominator,
      this.denominator * rhs.denominator
    );
  }

  sub = this.subtract;
  subtract(rhs: Fraction | TFractionLike): Fraction {
    rhs = Fraction.asFraction(rhs);
    return new Fraction(
      this.numerator * rhs.denominator - rhs.numerator * this.denominator,
      this.denominator * rhs.denominator
    );
  }

  mul = this.multiply;
  multiply(rhs: Fraction | TFractionLike): Fraction {
    rhs = Fraction.asFraction(rhs);
    return new Fraction(
      this.numerator * rhs.numerator,
      this.denominator * rhs.denominator
    );
  }

  div = this.divide;
  divide(rhs: Fraction | TFractionLike): Fraction {
    rhs = Fraction.asFraction(rhs);
    return new Fraction(
      this.numerator * rhs.denominator,
      this.denominator * rhs.numerator
    );
  }

  lt = this.lessThan;
  lessThan(rhs: Fraction | TFractionLike): boolean {
    rhs = Fraction.asFraction(rhs);
    return this.numerator * rhs.denominator < rhs.numerator * this.denominator;
  }

  lte = this.lessThanOrEqual;
  lessThanOrEqual(rhs: Fraction | TFractionLike): boolean {
    rhs = Fraction.asFraction(rhs);
    return this.numerator * rhs.denominator <= rhs.numerator * this.denominator;
  }

  eq = this.equals;
  equals(rhs: Fraction | TFractionLike): boolean {
    rhs = Fraction.asFraction(rhs);
    return (
      this.numerator * rhs.denominator === rhs.numerator * this.denominator
    );
  }

  gt = this.greaterThan;
  greaterThan(rhs: Fraction | TFractionLike): boolean {
    rhs = Fraction.asFraction(rhs);
    return this.numerator * rhs.denominator > rhs.numerator * this.denominator;
  }

  gte = this.greaterThanOrEqual;
  greaterThanOrEqual(rhs: Fraction | TFractionLike): boolean {
    rhs = Fraction.asFraction(rhs);
    return this.numerator * rhs.denominator >= rhs.numerator * this.denominator;
  }

  invert(): Fraction {
    return new Fraction(this.denominator, this.numerator);
  }

  get quotient(): bigint {
    return this.numerator / this.denominator;
  }

  getQuotient(): bigint {
    return this.numerator / this.denominator;
  }

  get remainder(): Fraction {
    return new Fraction(this.numerator % this.denominator, this.denominator);
  }

  toPrecision(decimals: number): Fraction {
    return Fraction.parseString(this.toString(decimals));
  }

  getRemainder(): Fraction {
    return new Fraction(this.numerator % this.denominator, this.denominator);
  }

  getRemainderOrNull(): Fraction | null {
    const remainder = this.getRemainder();
    return remainder.equals(Fraction.ZERO) ? null : remainder;
  }

  formatQuotientToLocaleString(locale?: string): string {
    return Intl.NumberFormat(locale).format(this.getQuotient());
  }

  remainderToString(decimals = Fraction.MAX_DECIMALS): string {
    if (decimals <= 0) return "";
    const remainder = this.getRemainder();
    return remainder.equals(Fraction.ZERO)
      ? ""
      : remainder
          .multiply(10n ** BigInt(decimals))
          .getQuotient()
          .toString()
          .replace(/^-/, "")
          .substring(0, decimals)
          .padStart(decimals, "0")
          .replace(/0*$/, "");
  }

  // toLocaleString(locale?: string, decimals = Fraction.MAX_DECIMALS): string {
  //   const formattedIntegerPart = Intl.NumberFormat(locale).format(
  //     this.getQuotient()
  //   );
  //   const formattedFractionalPart = this.remainderToString(decimals);
  //   return formattedFractionalPart
  //     ? `${formattedIntegerPart}${getDecimalSeparator(
  //         locale
  //       )}${formattedFractionalPart}`
  //     : formattedIntegerPart;
  // }

  toNumber(decimals = Fraction.MAX_DECIMALS): number {
    return Number(this.toString(decimals));
  }

  toString(decimals = Fraction.MAX_DECIMALS): string {
    const formattedIntegerPart = this.getQuotient().toString();
    const formattedFractionalPart = this.remainderToString(decimals);
    return formattedFractionalPart
      ? `${formattedIntegerPart}.${formattedFractionalPart}`
      : formattedIntegerPart;
  }

  /**
   * @override
   * @param _key
   * @returns
   */
  toJSON(_key?: string | number): string {
    return this.toString();
  }
}
