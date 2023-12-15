import {
  ElementTransformer,
  TextFormatTransformer,
  TextMatchTransformer,
  Transformer,
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from '@lexical/markdown'

function indexBy<T>(list: Array<T>, callback: (arg0: T) => string): Readonly<Record<string, Array<T>>> {
  const index: Record<string, Array<T>> = {}

  for (const item of list) {
    const key = callback(item)

    if (index[key]) {
      index[key].push(item)
    } else {
      index[key] = [item]
    }
  }

  return index
}

export function transformersByType(transformers: Array<Transformer>): Readonly<{
  element: Array<ElementTransformer>
  textFormat: Array<TextFormatTransformer>
  textMatch: Array<TextMatchTransformer>
}> {
  const byType = indexBy(transformers, (t) => t.type)

  return {
    element: (byType.element || []) as Array<ElementTransformer>,
    textFormat: (byType['text-format'] || []) as Array<TextFormatTransformer>,
    textMatch: (byType['text-match'] || []) as Array<TextMatchTransformer>,
  }
}

export const TRANSFORMERS: Array<Transformer> = [
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
]
