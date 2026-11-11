/** Che bớt email để hiển thị: "nguyenhonghai.dev@gmail.com" → "ng***v@g***m". */
export const maskEmail = (email: string): string => {
  const [local = "", domain = ""] = email.split("@");
  const head = local.slice(0, 2);
  const tail = local.length > 2 ? local.slice(-1) : "";
  const domainMasked = domain ? `${domain[0]}***${domain.slice(-1)}` : "";
  return `${head}***${tail}@${domainMasked}`;
};
