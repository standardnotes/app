export type Status = {
  type: 'saving' | 'saved' | 'error'
  message: string
  desc?: string
}
