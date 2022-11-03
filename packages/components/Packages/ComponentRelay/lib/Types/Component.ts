import { ComponentData } from './ComponentData'

export type Component = {
  uuid?: string
  origin?: string
  data?: ComponentData
  sessionKey?: string
  environment?: string
  platform?: string
  isMobile?: boolean
  acceptsThemes: boolean
  activeThemes: string[]
}
