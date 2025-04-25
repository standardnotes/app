declare class Highlight extends Set<AbstractRange> {
  constructor(...range: Range[])
}

declare namespace CSS {
  const highlights: Map<string, Highlight>
}
