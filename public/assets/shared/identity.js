/** Canonical profile identity; account and resource UUIDs have separate contracts. */
export const isParrotId = value => typeof value === "string"
  && /^P669-[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){2}$/.test(value) && value.length === 19;
