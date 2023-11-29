import { observer } from 'mobx-react-lite'
import { FunctionComponent, useRef } from 'react'
import { UpgradePrompt } from '../PremiumFeaturesModal/Subviews/UpgradePrompt'
import { useApplication } from '../ApplicationProvider'

export const PreferencesPremiumOverlay: FunctionComponent = () => {
  const ctaButtonRef = useRef<HTMLButtonElement>(null)

  const application = useApplication()

  const hasSubscription = application.hasValidFirstPartySubscription()

  const onClick = () => {
    application.preferencesController.closePreferences()
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 flex flex-col items-center justify-center">
      <div className="absolute h-full w-full bg-default opacity-[86%]"></div>
      <div className="border-1 z-10 rounded border border-border bg-default p-5">
        <UpgradePrompt
          featureName={'Plugin Gallery'}
          ctaRef={ctaButtonRef}
          application={application}
          hasSubscription={hasSubscription}
          inline={true}
          onClick={onClick}
        />
      </div>
    </div>
  )
}

export default observer(PreferencesPremiumOverlay)
