export function isRedundant(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return true;
  return x === y || x.includes(y) || y.includes(x);
}
