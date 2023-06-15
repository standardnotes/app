export type Status = {
  state: 'restarting' | 'online' | 'error'
  message: string
  description?: string
}
