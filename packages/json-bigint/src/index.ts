import JSONBigConstr from "json-bigint";

export const JSONBig = JSONBigConstr;

const JSON = JSONBigConstr({
  useNativeBigInt: true,
  constructorAction: "preserve",
  protoAction: "preserve",
}) as globalThis.JSON;

export const { parse, stringify } = JSON;

export default JSON;
