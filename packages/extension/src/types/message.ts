export const RuntimeMessageTypes = {
  GetArticle: 'get-article',
  GetSelection: 'get-selection',
  GetFullPage: 'get-full-page',
  ClipSelection: 'clip-selection',
} as const

export type RuntimeMessageType = typeof RuntimeMessageTypes[keyof typeof RuntimeMessageTypes]

export type RuntimeMessage = {
  type: RuntimeMessageType
  payload?: any
}
