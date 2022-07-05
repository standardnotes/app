export enum ActionAccessType {
  Encrypted = 'encrypted',
  Decrypted = 'decrypted',
}

export enum ActionVerb {
  Get = 'get',
  Render = 'render',
  Show = 'show',
  Post = 'post',
  Nested = 'nested',
}

export type Action = {
  label: string
  desc: string
  running?: boolean
  error?: boolean
  lastExecuted?: Date
  context?: string
  verb: ActionVerb
  url: string
  access_type: ActionAccessType
  subactions?: Action[]
}
