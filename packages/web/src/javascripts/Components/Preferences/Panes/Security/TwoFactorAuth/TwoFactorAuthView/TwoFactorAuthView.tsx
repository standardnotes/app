import { FunctionComponent } from 'react'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { is2FAActivation, is2FAEnabled, TwoFactorAuth } from '../TwoFactorAuth'
import TwoFactorActivationView from '../TwoFactorActivationView'
import TwoFactorTitle from './TwoFactorTitle'
import TwoFactorDescription from './TwoFactorDescription'
import TwoFactorSwitch from './TwoFactorSwitch'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/WebApplication'
import RecoveryCodeBanner from '@/Components/RecoveryCodeBanner/RecoveryCodeBanner'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import ModalOverlay from '@/Components/Modal/ModalOverlay'

type Props = {
  auth: TwoFactorAuth
  application: WebApplication
  canDisable2FA: boolean
}

const TwoFactorAuthView: FunctionComponent<Props> = ({ auth, application, canDisable2FA }) => {
  const shouldShowActivationModal = auth.status !== 'fetching' && is2FAActivation(auth.status)

  const activationModalTitle = shouldShowActivationModal
    ? auth.status.activationStep === 'scan-qr-code'
      ? 'Step 1 of 3 - Scan QR code'
      : auth.status.activationStep === 'save-secret-key'
      ? 'Step 2 of 3 - Save secret key'
      : auth.status.activationStep === 'verification'
      ? 'Step 3 of 3 - Verification'
      : auth.status.activationStep === 'success'
      ? 'Successfully Enabled'
      : ''
    : ''

  const closeActivationModal = () => {
    if (auth.status === 'fetching') {
      return
    }
    if (!is2FAActivation(auth.status)) {
      return
    }
    if (auth.status.activationStep === 'success') {
      auth.status.finishActivation()
    }
    auth.status.cancelActivation()
  }

  const activationModalActions: ModalAction[] = shouldShowActivationModal
    ? [
        {
          label: 'Cancel',
          onClick: auth.status.cancelActivation,
          type: 'cancel',
          mobileSlot: 'left',
          hidden: auth.status.activationStep !== 'scan-qr-code',
        },
        {
          label: 'Back',
          onClick:
            auth.status.activationStep === 'save-secret-key'
              ? auth.status.openScanQRCode
              : auth.status.openSaveSecretKey,
          type: 'cancel',
          mobileSlot: 'left',
          hidden: auth.status.activationStep !== 'save-secret-key' && auth.status.activationStep !== 'verification',
        },
        {
          label: 'Next',
          onClick:
            auth.status.activationStep === 'scan-qr-code'
              ? auth.status.openSaveSecretKey
              : auth.status.activationStep === 'save-secret-key'
              ? auth.status.openVerification
              : auth.status.enable2FA,
          type: 'primary',
          mobileSlot: 'right',
          hidden: auth.status.activationStep === 'success',
        },
        {
          label: 'Finish',
          onClick: auth.status.finishActivation,
          type: 'primary',
          mobileSlot: 'right',
          hidden: auth.status.activationStep !== 'success',
        },
      ]
    : []

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <div className="flex flex-row gap-2 md:items-center">
            <div className="flex flex-grow flex-col">
              <TwoFactorTitle auth={auth} />
              <TwoFactorDescription auth={auth} />
            </div>
            <TwoFactorSwitch auth={auth} canDisable2FA={canDisable2FA} />
          </div>
        </PreferencesSegment>

        {auth.errorMessage != null && (
          <PreferencesSegment>
            <Text className="text-danger">{auth.errorMessage}</Text>
          </PreferencesSegment>
        )}
        {auth.status !== 'fetching' && is2FAEnabled(auth.status) && (
          <PreferencesSegment>
            <div className="mt-3">
              <RecoveryCodeBanner application={application} />
            </div>
          </PreferencesSegment>
        )}
      </PreferencesGroup>
      <ModalOverlay isOpen={shouldShowActivationModal} close={closeActivationModal}>
        <Modal title={activationModalTitle} close={closeActivationModal} actions={activationModalActions}>
          {shouldShowActivationModal && <TwoFactorActivationView activation={auth.status} />}
        </Modal>
      </ModalOverlay>
    </>
  )
}

export default observer(TwoFactorAuthView)
