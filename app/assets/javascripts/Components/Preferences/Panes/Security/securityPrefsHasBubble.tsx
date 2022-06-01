import { WebApplication } from '@/Application/Application'

export const securityPrefsHasBubble = (application: WebApplication): boolean => {
  return application.items.invalidItems.length > 0
}
