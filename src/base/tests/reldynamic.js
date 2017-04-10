

export function dynamicLoad() {
  return System.import('./reldynamicdep', { name: "tests/reldynamic" });
}
