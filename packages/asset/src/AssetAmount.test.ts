import { AssetAmount, AssetRatio, IAssetAmountMetadata } from "./AssetAmount";

let testAssetAData: IAssetAmountMetadata;

let testAssetBData: IAssetAmountMetadata;

let testAssetA: AssetAmount;
let testAssetB: AssetAmount;

beforeEach(() => {
  testAssetAData = {
    assetId: "test",
    decimals: 6,
  };

  testAssetBData = {
    assetId: "test-2",
    decimals: 0,
  };

  testAssetA = new AssetAmount(10000000n, testAssetAData);
  testAssetB = new AssetAmount(20n, testAssetBData);
});

describe("AssetAmount", () => {
  test("value is computed correctly", async () => {
    expect(new AssetAmount(1, 0).value.toString()).toBe("1");
    expect(new AssetAmount(1, 1).value.toString()).toBe("0.1");
    expect(new AssetAmount(1, 10).value.toString()).toBe(`0.${"0".repeat(9)}1`);
  });
});

describe("AssetAmount with metadata", () => {
  it("should construct correctly", () => {
    expect(testAssetA.amount).toEqual(10000000n);
    expect(testAssetA.decimals).toEqual(6);
    expect(testAssetA.metadata).toMatchObject(testAssetAData);

    expect(testAssetB.amount).toEqual(20n);
    expect(testAssetB.decimals).toEqual(0);
    expect(testAssetB.metadata).toEqual(testAssetBData);
  });

  it("exchangeMultiply()", () => {
    const ratio = new AssetRatio(testAssetA, testAssetB);
    const result = testAssetB.exchangeMultiply(ratio);
    expect(result.amount).toEqual(10000000n);
    expect(result.metadata).toEqual(testAssetAData);
    expect(result.decimals).toEqual(6);
  });

  it("exchangeDivide()", () => {
    const ratio = new AssetRatio(testAssetA, testAssetB);
    const result = testAssetA.exchangeDivide(ratio);
    expect(result.amount).toEqual(20n);
    expect(result.metadata).toEqual(testAssetBData);
    expect(result.decimals).toEqual(0);
  });

  it("exchangeAt()", () => {
    const ratio = new AssetRatio(testAssetA, testAssetB);
    const result1 = testAssetA.exchangeAt(ratio);
    const result2 = testAssetB.exchangeAt(ratio);
    expect(result1.amount).toEqual(20n);
    expect(result1.metadata).toEqual(testAssetBData);

    expect(result2.amount).toEqual(10000000n);
    expect(result2.metadata).toEqual(testAssetAData);
    expect(result2.decimals).toEqual(6);

    const ratio2 = new AssetRatio(
      new AssetAmount(250000000n, testAssetAData),
      new AssetAmount(200n, testAssetBData)
    );

    const result3 = testAssetA.exchangeAt(ratio2);
    expect(result3.amount).toEqual(8n);
    expect(result3.metadata).toEqual(testAssetBData);
    expect(result3.decimals).toEqual(0);
  });

  it("should throw correct errors", () => {
    const ratio = new AssetRatio(testAssetA, testAssetB);
    expect(() => testAssetB.exchangeDivide(ratio)).toThrowError(
      AssetAmount.INVALID_DIVISION_ERROR
    );
    expect(() => testAssetA.exchangeMultiply(ratio)).toThrowError(
      AssetAmount.INVALID_MULTIPLICATION_ERROR
    );

    const assetAmountWithoutMetadata = new AssetAmount(10n, 6);
    const assetAmountWithoutMetadata2 = new AssetAmount(10n, 0);
    const ratioWithoutMetadata = new AssetRatio(
      assetAmountWithoutMetadata,
      assetAmountWithoutMetadata2
    );

    // All AssetAmounts without metadata.
    expect(() =>
      assetAmountWithoutMetadata.exchangeAt(ratioWithoutMetadata)
    ).toThrowError(AssetAmount.INVALID_METADATA);

    // Just incorrect ratio AssetAmounts.
    expect(() => testAssetA.exchangeAt(ratioWithoutMetadata)).toThrowError(
      AssetAmount.INVALID_METADATA
    );

    // Just incorrect AssetAmount
    expect(() => assetAmountWithoutMetadata.exchangeAt(ratio)).toThrowError(
      AssetAmount.INVALID_METADATA
    );
  });
});
