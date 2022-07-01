import JSONBig from "json-bigint";

export const JSON = JSONBig({ useNativeBigInt: true }) as globalThis.JSON;

export default JSON;
