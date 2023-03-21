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

type MessagesWithPayload = typeof RuntimeMessageTypes.ClipSelection | typeof RuntimeMessageTypes.OpenPopupWithSelection

export type ClipPayload = {
  title: string
  content: string
}

export type RuntimeMessageReturnTypes = {
  [RuntimeMessageTypes.GetArticle]: ClipPayload
  [RuntimeMessageTypes.GetSelection]: ClipPayload
  [RuntimeMessageTypes.HasSelection]: boolean
  [RuntimeMessageTypes.GetFullPage]: ClipPayload
  [RuntimeMessageTypes.OpenPopupWithSelection]: void
  [RuntimeMessageTypes.ClipSelection]: void
  [RuntimeMessageTypes.StartNodeSelection]: void
}

export type RuntimeMessage =
  | {
      type: MessagesWithPayload
      payload: {
        title: string
        content: string
      }
    }
  | {
      type: Exclude<RuntimeMessageType, MessagesWithPayload>
    }
