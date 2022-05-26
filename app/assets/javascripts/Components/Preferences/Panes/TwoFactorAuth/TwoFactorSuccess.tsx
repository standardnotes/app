import { Button } from '@/Components/Button/Button'
import ModalDialog, {
  ModalDialogButtons,
  ModalDialogDescription,
  ModalDialogLabel,
} from '@/Components/Shared/ModalDialog'
import { Subtitle } from '@/Components/Preferences/PreferencesComponents'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { TwoFactorActivation } from './TwoFactorActivation'

type Props = {
  activation: TwoFactorActivation
}

export const TwoFactorSuccess: FunctionComponent<Props> = observer(({ activation: act }) => (
  <ModalDialog>
    <ModalDialogLabel closeDialog={act.finishActivation}>Successfully Enabled</ModalDialogLabel>
    <ModalDialogDescription>
      <div className="flex flex-row items-center justify-center pt-2">
        <Subtitle>Two-factor authentication has been successfully enabled for your account.</Subtitle>
      </div>
    </ModalDialogDescription>
    <ModalDialogButtons>
      <Button className="min-w-20" variant="primary" label="Finish" onClick={act.finishActivation} />
    </ModalDialogButtons>
  </ModalDialog>
))

TwoFactorSuccess.displayName = 'TwoFactorSuccess'
