declare class Highlight extends Set<AbstractRange> {
  constructor(...range: Range[])
}

declare namespace CSS {
  var highlights: Map<string, Highlight>
}
