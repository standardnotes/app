import { ApplicationGroup } from '@Lib/ApplicationGroup'
import { ApplicationGroupContext } from '@Root/ApplicationGroupContext'
import { useContext } from 'react'

export const useSafeApplicationGroupContext = () => {
  const applicationGroupContext = useContext(ApplicationGroupContext) as ApplicationGroup
  return applicationGroupContext
}
