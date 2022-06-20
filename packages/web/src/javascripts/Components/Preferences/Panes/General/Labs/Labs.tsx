import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { FeatureIdentifier, FeatureStatus, FindNativeFeature } from '@standardnotes/snjs'
import { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import LabsFeature from './LabsFeature'
import { StorageKey, useLocalStorageItem } from '@/Services/LocalStorage'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'

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
  }
}

const LabsPane: FunctionComponent<Props> = ({ application }) => {
  const [experimentalFeatures, setExperimentalFeatures] = useState<ExperimentalFeatureItem[]>([])
  const [isFilesNavigationEnabled, setFilesNavigation] = useLocalStorageItem(StorageKey.FilesNavigationEnabled)

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

  const toggleFilesNavigation = useCallback(() => {
    const isEntitled = application.features.getFeatureStatus(FeatureIdentifier.Files) === FeatureStatus.Entitled

    if (!isEntitled) {
      premiumModal.activate('Files navigation')
    }

    setFilesNavigation(!isFilesNavigationEnabled)
  }, [application.features, isFilesNavigationEnabled, premiumModal, setFilesNavigation])

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
                  identifier={identifier}
                  name={name}
                  description={description}
                  toggleFeature={toggleFeature}
                  isEnabled={isEnabled}
                />
                {showHorizontalSeparator && <HorizontalSeparator classes="mt-2.5 mb-3" />}
              </Fragment>
            )
          })}
          <HorizontalSeparator classes="mt-2.5 mb-3" />
          <LabsFeature
            identifier={StorageKey.FilesNavigationEnabled as string as FeatureIdentifier}
            name="Files navigation"
            description={'Enables a "Files" view which allows for better files navigation. Requires reload.'}
            toggleFeature={toggleFilesNavigation}
            isEnabled={!!isFilesNavigationEnabled}
          />
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
