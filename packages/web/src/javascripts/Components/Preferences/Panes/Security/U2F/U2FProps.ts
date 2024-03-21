import { WebApplication } from '@/Application/WebApplication'

export interface U2FProps {
  application: WebApplication
  is2FAEnabled: boolean
  loadAuthenticatorsCallback: (devices: Array<{ id: string; name: string }>) => void
}
