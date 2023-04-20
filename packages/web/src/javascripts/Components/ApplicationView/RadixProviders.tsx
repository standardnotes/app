import { Provider as TooltipProvider } from '@radix-ui/react-tooltip'
import { ReactNode } from 'react'

const RadixProviders = ({ children }: { children: ReactNode }) => {
  return <TooltipProvider delayDuration={350}>{children}</TooltipProvider>
}

export default RadixProviders
