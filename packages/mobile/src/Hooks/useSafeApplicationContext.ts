import { MobileApplication } from '@Lib/Application'
import { ApplicationContext } from '@Root/ApplicationContext'
import { useContext } from 'react'

export const useSafeApplicationContext = () => {
  const application = useContext(ApplicationContext) as MobileApplication
  return application
}
