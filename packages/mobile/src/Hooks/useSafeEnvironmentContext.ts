import { TEnvironment } from '@Root/App'
import { EnvironmentContext } from '@Root/EnvironmentContext'
import { useContext } from 'react'

export const useSafeEnvironmentContext = () => {
  const env = useContext(EnvironmentContext) as TEnvironment
  return env
}
