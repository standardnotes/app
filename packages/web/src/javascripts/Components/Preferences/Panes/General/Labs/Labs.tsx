import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { ApplicationEvent, FeatureIdentifier, FeatureStatus, FindNativeFeature, PrefKey } from '@standardnotes/snjs'
import { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import LabsFeature from './LabsFeature'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { PrefDefaults } from '@/Constants/PrefDefaults'

type ExperimentalFeatureItem = {
  identifier: FeatureIdentifier
  name: string
  description: string
  isEnabled: boolean
  isEntitled: boolean
}

type Props = {
  application: {
    features: WebApplication['features']
    getPreference: WebApplication['getPreference']
    setPreference: WebApplication['setPreference']
    addSingleEventObserver: WebApplication['addSingleEventObserver']
  }
}

const LabsPane: FunctionComponent<Props> = ({ application }) => {
  const [experimentalFeatures, setExperimentalFeatures] = useState<ExperimentalFeatureItem[]>([])

  const [isPaneGesturesEnabled, setIsPaneGesturesEnabled] = useState(() =>
    application.getPreference(PrefKey.PaneGesturesEnabled, PrefDefaults[PrefKey.PaneGesturesEnabled]),
  )
  useEffect(() => {
    return application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
      setIsPaneGesturesEnabled(
        application.getPreference(PrefKey.PaneGesturesEnabled, PrefDefaults[PrefKey.PaneGesturesEnabled]),
      )
    })
  }, [application])

  const reloadExperimentalFeatures = useCallback(() => {
    const experimentalFeatures = application.features.getExperimentalFeatures().map((featureIdentifier) => {
      const feature = FindNativeFeature(featureIdentifier)
      return {
        identifier: featureIdentifier,
        name: feature?.name ?? featureIdentifier,
        description: feature?.description ?? '',
        isEnabled: application.features.isExperimentalFeatureEnabled(featureIdentifier),
        isEntitled: application.features.getFeatureStatus(featureIdentifier) === FeatureStatus.Entitled,
      }
    })
    setExperimentalFeatures(experimentalFeatures)
  }, [application])

  useEffect(() => {
    reloadExperimentalFeatures()
  }, [reloadExperimentalFeatures])

  const premiumModal = usePremiumModal()

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Labs</Title>
        <div>
          {isMobileScreen && (
            <LabsFeature
              name="Pane switch gestures"
              description="Allows using gestures to navigate"
              isEnabled={isPaneGesturesEnabled}
              toggleFeature={() => {
                void application.setPreference(PrefKey.PaneGesturesEnabled, !isPaneGesturesEnabled)
              }}
            />
          )}
          {experimentalFeatures.map(({ identifier, name, description, isEnabled, isEntitled }, index) => {
            const toggleFeature = () => {
              if (!isEntitled) {
                premiumModal.activate(name)
                return
              }

              application.features.toggleExperimentalFeature(identifier)
              reloadExperimentalFeatures()
            }

            const showHorizontalSeparator = experimentalFeatures.length > 1 && index !== experimentalFeatures.length - 1

            return (
              <Fragment key={identifier}>
                <LabsFeature
                  name={name}
                  description={description}
                  toggleFeature={toggleFeature}
                  isEnabled={isEnabled}
                />
                {showHorizontalSeparator && <HorizontalSeparator classes="mt-2.5 mb-3" />}
              </Fragment>
            )
          })}
          {(experimentalFeatures.length === 0 || typeof isPaneGesturesEnabled === 'boolean') && (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Text>No experimental features available.</Text>
              </div>
            </div>
          )}
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default LabsPane
