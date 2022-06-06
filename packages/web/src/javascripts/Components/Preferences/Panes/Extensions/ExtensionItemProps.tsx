import { WebApplication } from '@/Application/Application'
import { AnyExtension } from './AnyExtension'

export interface ExtensionItemProps {
  application: WebApplication
  extension: AnyExtension
  first: boolean
  latestVersion: string | undefined
  uninstall: (extension: AnyExtension) => void
  toggleActivate?: (extension: AnyExtension) => void
}
