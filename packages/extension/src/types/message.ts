export const RuntimeMessageTypes = {
  GetArticle: 'get-article',
  GetSelection: 'get-selection',
  HasSelection: 'has-selection',
  GetFullPage: 'get-full-page',
  OpenPopupWithSelection: 'open-popup-with-selection',
  StartNodeSelection: 'start-node-selection',
} as const

export type RuntimeMessageType = typeof RuntimeMessageTypes[keyof typeof RuntimeMessageTypes]

type MessagesWithClipPayload = typeof RuntimeMessageTypes.OpenPopupWithSelection

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
  [RuntimeMessageTypes.StartNodeSelection]: void
}

export type RuntimeMessage =
  | {
      type: MessagesWithClipPayload
      payload: ClipPayload
    }
  | {
      type: Exclude<RuntimeMessageType, MessagesWithClipPayload>
    }
