export const RuntimeMessageTypes = {
  GetArticle: 'get-article',
  GetSelection: 'get-selection',
  HasSelection: 'has-selection',
  GetFullPage: 'get-full-page',
  OpenPopupWithSelection: 'open-popup-with-selection',
  ClipSelection: 'clip-selection',
  StartNodeSelection: 'start-node-selection',
} as const

export type RuntimeMessageType = typeof RuntimeMessageTypes[keyof typeof RuntimeMessageTypes]

export type RuntimeMessage = {
  type: RuntimeMessageType
  payload?: any
}
