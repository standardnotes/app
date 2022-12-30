import { FunctionComponent } from 'react'
import Switch from '@/Components/Switch/Switch'
import { observer } from 'mobx-react-lite'
import { isU2FDisabled, U2FAuth } from '../U2FAuth'
import Spinner from '@/Components/Spinner/Spinner'

type Props = {
  auth: U2FAuth
}

const U2FSwitch: FunctionComponent<Props> = ({ auth }) => {
  if (!auth.isLoggedIn()) {
    return null
  }

  if (auth.status === 'fetching') {
    return <Spinner className="h-4 w-4" />
  }

  return <Switch checked={!isU2FDisabled(auth.status)} onChange={auth.toggle2FA} />
}

export default observer(U2FSwitch)
