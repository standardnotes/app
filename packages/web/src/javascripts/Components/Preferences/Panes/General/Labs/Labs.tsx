import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { FeatureIdentifier, FeatureStatus, FindNativeFeature } from '@standardnotes/snjs'
import { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import LabsFeature from './LabsFeature'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { FilesTableViewLabsKey } from '@/Constants/Constants'

type ExperimentalFeatureItem = {
  identifier: FeatureIdentifier
  name: string
  description: string
  isEnabled: boolean
  isEntitled: boolean
}

type Props = {
  application: {
    setValue: WebApplication['setValue']
    getValue: WebApplication['getValue']
    features: WebApplication['features']
  }
}

const hasTemporaryFeatureToggles = true

const LabsPane: FunctionComponent<Props> = ({ application }) => {
  const [experimentalFeatures, setExperimentalFeatures] = useState<ExperimentalFeatureItem[]>([])
  const [isFilesTableViewEnabled, setIsFilesTableViewEnabled] = useState<boolean>(
    () => (application.getValue(FilesTableViewLabsKey) as boolean) || false,
  )

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
          <LabsFeature
            name="Files Table View"
            description="Replaces the current Files view with a table view. Requires reload."
            toggleFeature={() => {
              application.setValue(FilesTableViewLabsKey, !isFilesTableViewEnabled)
              setIsFilesTableViewEnabled(!isFilesTableViewEnabled)
            }}
            isEnabled={isFilesTableViewEnabled}
          />
          {experimentalFeatures.length === 0 && !hasTemporaryFeatureToggles && (
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
