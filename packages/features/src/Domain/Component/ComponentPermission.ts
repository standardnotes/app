import { ComponentAction } from './ComponentAction'

export type ComponentPermission = {
  name: ComponentAction
  content_types?: string[]
}
