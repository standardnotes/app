import { Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { TwoFactorActivation } from './TwoFactorActivation'
import { c } from 'ttag'

type Props = {
  activation: TwoFactorActivation
}

const TwoFactorSuccess: FunctionComponent<Props> = () => (
  <div className="flex flex-row items-center px-4 py-4">
    <div className="flex flex-row items-center justify-center pt-2">
      <Subtitle>{c('B6.Preferences.Security.Info')
        .t`Two-factor authentication has been successfully enabled for your account.`}</Subtitle>
    </div>
  </div>
)

export default observer(TwoFactorSuccess)
