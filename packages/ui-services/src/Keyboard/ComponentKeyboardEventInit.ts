export type ComponentKeyboardEventInit = Pick<
  KeyboardEvent,
  'key' | 'code' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'
>

export function isComponentKeyboardEventInit(data: {
  key?: string
  code?: string
}): data is ComponentKeyboardEventInit {
  return data.key !== undefined && data.code !== undefined
}
