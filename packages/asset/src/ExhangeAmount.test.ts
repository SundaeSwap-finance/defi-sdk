import {
  ExchangeAmount,
  ExchangeAssetRatio,
  IExchangeAmountAsset,
} from "./ExchangeAmount";

let testAssetAData: IExchangeAmountAsset;

let testAssetBData: IExchangeAmountAsset;

let testAssetA: ExchangeAmount;
let testAssetB: ExchangeAmount;

beforeEach(() => {
  testAssetAData = {
    assetId: "test",
    decimals: 6,
  };

  testAssetBData = {
    assetId: "test-2",
    decimals: 0,
  };

  testAssetA = new ExchangeAmount(10000000n, testAssetAData);
  testAssetB = new ExchangeAmount(20n, testAssetBData);
});

describe("ExchangeAmount", () => {
  it("should construct correctly", () => {
    expect(testAssetA.amount).toEqual(10000000n);
    expect(testAssetA.decimals).toEqual(6);
    expect(testAssetA.asset).toMatchObject(testAssetAData);

    expect(testAssetB.amount).toEqual(20n);
    expect(testAssetB.decimals).toEqual(0);
    expect(testAssetB.asset).toEqual(testAssetBData);
  });

  it("multiply()", () => {
    const ratio = new ExchangeAssetRatio(testAssetA, testAssetB);
    expect(() => testAssetA.multiply(ratio)).toThrowError(
      ExchangeAmount.INVALID_MULTIPLICATION_ERROR
    );

    const result = testAssetB.multiply(ratio);
    expect(result.amount).toEqual(10000000n);
    expect(result.asset).toEqual(testAssetAData);
    expect(result.decimals).toEqual(6);
  });

  it("divide()", () => {
    const ratio = new ExchangeAssetRatio(testAssetA, testAssetB);
    expect(() => testAssetB.divide(ratio)).toThrowError(
      ExchangeAmount.INVALID_DIVISION_ERROR
    );

    const result = testAssetA.divide(ratio);
    expect(result.amount).toEqual(20n);
    expect(result.asset).toEqual(testAssetBData);
    expect(result.decimals).toEqual(0);
  });

  it("exchangeAt()", () => {
    const ratio = new ExchangeAssetRatio(testAssetA, testAssetB);
    const result1 = testAssetA.exchangeAt(ratio);
    const result2 = testAssetB.exchangeAt(ratio);
    expect(result1.amount).toEqual(20n);
    expect(result1.asset).toEqual(testAssetBData);

    expect(result2.amount).toEqual(10000000n);
    expect(result2.asset).toEqual(testAssetAData);
    expect(result2.decimals).toEqual(6);

    const ratio2 = new ExchangeAssetRatio(
      new ExchangeAmount(250000000n, testAssetAData),
      new ExchangeAmount(200n, testAssetBData)
    );

    const result3 = testAssetA.exchangeAt(ratio2);
    expect(result3.amount).toEqual(8n);
    expect(result3.asset).toEqual(testAssetBData);
    expect(result3.decimals).toEqual(0);
  });
});
