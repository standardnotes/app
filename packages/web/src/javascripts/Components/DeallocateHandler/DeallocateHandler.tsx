import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, ReactNode } from 'react'

type Props = {
  application: WebApplication
  children?: ReactNode
}

const DeallocateHandler: FunctionComponent<Props> = ({ application, children }) => {
  if (application.dealloced) {
    return null
  }

  return <>{children}</>
}

export default observer(DeallocateHandler)
