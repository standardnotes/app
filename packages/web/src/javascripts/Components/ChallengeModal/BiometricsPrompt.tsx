import { WebApplication } from '@/Application/WebApplication'
import { ChallengePrompt } from '@standardnotes/services'
import { RefObject, useState } from 'react'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import { InputValue } from './InputValue'

type Props = {
  application: WebApplication
  onValueChange: (value: InputValue['value'], prompt: ChallengePrompt) => void
  prompt: ChallengePrompt
  buttonRef: RefObject<HTMLButtonElement>
}

const BiometricsPrompt = ({ application, onValueChange, prompt, buttonRef }: Props) => {
  const [authenticated, setAuthenticated] = useState(false)

  return (
    <div className="min-w-76">
      <Button
        primary
        fullWidth
        colorStyle={authenticated ? 'success' : 'info'}
        onClick={async () => {
          const authenticated = await application.mobileDevice.authenticateWithBiometrics()
          setAuthenticated(authenticated)
          onValueChange(authenticated, prompt)
        }}
        ref={buttonRef}
      >
        {authenticated ? (
          <span className="flex items-center justify-center gap-3">
            <Icon type="check-circle" />
            Biometrics successful
          </span>
        ) : (
          'Tap to use biometrics'
        )}
      </Button>
    </div>
  )
}

export default BiometricsPrompt
