import { HttpRequest } from '@standardnotes/snjs'

export const RuntimeMessageTypes = {
  GetArticle: 'get-article',
  GetSelection: 'get-selection',
  HasSelection: 'has-selection',
  GetFullPage: 'get-full-page',
  OpenPopupWithSelection: 'open-popup-with-selection',
  StartNodeSelection: 'start-node-selection',
  ToggleScreenshotMode: 'toggle-screenshot-mode',
  CaptureVisibleTab: 'capture-visible-tab',
  RunHttpRequest: 'run-http-request',
} as const

export type RuntimeMessageType = (typeof RuntimeMessageTypes)[keyof typeof RuntimeMessageTypes]

type MessagesWithClipPayload = typeof RuntimeMessageTypes.OpenPopupWithSelection

export type ClipPayload = {
  title: string
  content: string
  url: string
  isScreenshot?: boolean
}

export type RuntimeMessageReturnTypes = {
  [RuntimeMessageTypes.GetArticle]: ClipPayload
  [RuntimeMessageTypes.GetSelection]: ClipPayload
  [RuntimeMessageTypes.HasSelection]: boolean
  [RuntimeMessageTypes.GetFullPage]: ClipPayload
  [RuntimeMessageTypes.CaptureVisibleTab]: string
  [RuntimeMessageTypes.OpenPopupWithSelection]: void
  [RuntimeMessageTypes.StartNodeSelection]: void
  [RuntimeMessageTypes.ToggleScreenshotMode]: void
  [RuntimeMessageTypes.RunHttpRequest]: void
}

export type RuntimeMessage =
  | {
      type: MessagesWithClipPayload
      payload: ClipPayload
    }
  | {
      type: typeof RuntimeMessageTypes.RunHttpRequest
      payload: HttpRequest
    }
  | {
      type: typeof RuntimeMessageTypes.ToggleScreenshotMode
      enabled: boolean
    }
  | {
      type: Exclude<
        RuntimeMessageType,
        | MessagesWithClipPayload
        | typeof RuntimeMessageTypes.ToggleScreenshotMode
        | typeof RuntimeMessageTypes.RunHttpRequest
      >
    }
