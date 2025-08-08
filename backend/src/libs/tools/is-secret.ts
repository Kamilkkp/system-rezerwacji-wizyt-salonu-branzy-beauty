const secretKeys = [
  /passw(or)?d/i,
  /^pw$/,
  /^pass$/i,
  /secret/i,
  /token/i,
  /api[-._]?key/i,
];

export const isSecretKey = (key: string) =>
  secretKeys.some((regex) => regex.test(key));
