import JSONBigConstr from "json-bigint";

export const JSONBig = JSONBigConstr as any;

const sharedProps: Parameters<typeof JSONBigConstr>[0] = {
  useNativeBigInt: true,
  constructorAction: "preserve",
  protoAction: "preserve",
};

const JSON = JSONBigConstr(sharedProps) as globalThis.JSON;

export const { parse, stringify } = JSON;

export const JSONAlwaysBig = JSONBigConstr({
  ...sharedProps,
  alwaysParseAsBig: true,
}) as globalThis.JSON;

export default JSON;
