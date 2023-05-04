import { WebApplication } from '@/Application/WebApplication'

export const securityPrefsHasBubble = (application: WebApplication): boolean => {
  return application.items.invalidItems.length > 0
}
