import Button from '@/Components/Button/Button'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import { Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { TwoFactorActivation } from './TwoFactorActivation'

type Props = {
  activation: TwoFactorActivation
}

const TwoFactorSuccess: FunctionComponent<Props> = ({ activation: act }) => (
  <ModalDialog>
    <ModalDialogLabel closeDialog={act.finishActivation}>Successfully Enabled</ModalDialogLabel>
    <ModalDialogDescription className="flex flex-row items-center">
      <div className="flex flex-row items-center justify-center pt-2">
        <Subtitle>Two-factor authentication has been successfully enabled for your account.</Subtitle>
      </div>
    </ModalDialogDescription>
    <ModalDialogButtons>
      <Button className="min-w-20" primary label="Finish" onClick={act.finishActivation} />
    </ModalDialogButtons>
  </ModalDialog>
)

export default observer(TwoFactorSuccess)
