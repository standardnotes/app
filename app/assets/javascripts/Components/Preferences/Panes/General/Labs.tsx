import Switch from '@/Components/Switch/Switch'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/UIModels/Application'
import { FeatureIdentifier, FeatureStatus, FindNativeFeature } from '@standardnotes/snjs'
import { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type ExperimentalFeatureItem = {
  identifier: FeatureIdentifier
  name: string
  description: string
  isEnabled: boolean
  isEntitled: boolean
}

type Props = {
  application: WebApplication
}

const LabsPane: FunctionComponent<Props> = ({ application }) => {
  const [experimentalFeatures, setExperimentalFeatures] = useState<ExperimentalFeatureItem[]>([])

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

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Labs</Title>
        <div>
          {experimentalFeatures.map(({ identifier, name, description, isEnabled, isEntitled }, index: number) => {
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
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Subtitle>{name}</Subtitle>
                    <Text>{description}</Text>
                  </div>
                  <Switch onChange={toggleFeature} checked={isEnabled} />
                </div>
                {showHorizontalSeparator && <HorizontalSeparator classes="mt-5 mb-3" />}
              </Fragment>
            )
          })}
          {experimentalFeatures.length === 0 && (
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
