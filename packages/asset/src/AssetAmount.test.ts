import { AssetAmount } from "./AssetAmount";

describe("AssetAmount", () => {
  test("value is computed correctly", async () => {
    expect(new AssetAmount(1, 0).value.toString()).toBe("1");
    expect(new AssetAmount(1, 1).value.toString()).toBe("0.1");
    expect(new AssetAmount(1, 10).value.toString()).toBe(`0.${"0".repeat(9)}1`);
  });
});
