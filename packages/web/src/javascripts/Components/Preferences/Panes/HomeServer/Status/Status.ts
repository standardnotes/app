export type Status = {
  state: 'restarting' | 'online' | 'error' | 'offline'
  message: string
  description?: string | JSX.Element
}
