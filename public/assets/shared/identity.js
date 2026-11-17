/** Canonical profile identity; account and resource UUIDs have separate contracts. */
export const isParrotId = value => typeof value === "string"
  && /^P669-[0-9A-F]{4}(?:-[0-9A-F]{4}){3}$/.test(value) && value.length === 24;
