import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'

type Props = {
  application: WebApplication
}

const DeallocateHandler: FunctionComponent<Props> = ({ application, children }) => {
  if (application.dealloced) {
    return null
  }

  return <>{children}</>
}

export default observer(DeallocateHandler)
