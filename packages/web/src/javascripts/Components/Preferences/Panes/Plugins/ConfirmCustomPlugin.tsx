import { ContentType } from '@standardnotes/snjs'

import Button from '@/Components/Button/Button'
import { Fragment, FunctionComponent } from 'react'
import { Title, Text, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { AnyPackageType } from './AnyPackageType'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

const ConfirmCustomPlugin: FunctionComponent<{
  component: AnyPackageType
  callback: (confirmed: boolean) => void
}> = ({ component, callback }) => {
  let contentTypeDisplayName = null
  const contentTypeOrError = ContentType.create(component.content_type)
  if (!contentTypeOrError.isFailed()) {
    contentTypeDisplayName = contentTypeOrError.getValue().getDisplayName()
  }

  const fields = [
    {
      label: 'Name',
      value: component.package_info.name,
    },
    {
      label: 'Description',
      value: component.package_info.description,
    },
    {
      label: 'Version',
      value: component.package_info.version,
    },
    {
      label: 'Hosted URL',
      value: component.thirdPartyPackageInfo.url,
    },
    {
      label: 'Download URL',
      value: component.package_info.download_url,
    },
    {
      label: 'Extension Type',
      value: contentTypeDisplayName,
    },
  ]

  return (
    <PreferencesSegment>
      <Title>Confirm Extension</Title>

      {fields.map((field) => {
        if (!field.value) {
          return undefined
        }
        return (
          <Fragment key={field.value}>
            <Subtitle>{field.label}</Subtitle>
            <Text className="wrap mb-2">{field.value}</Text>
          </Fragment>
        )
      })}

      <div className="mt-3 flex flex-row">
        <Button className="min-w-20" label="Cancel" onClick={() => callback(false)} />

        <div className="min-w-3" />

        <Button className="min-w-20" label="Install" onClick={() => callback(true)} />
      </div>
    </PreferencesSegment>
  )
}

export default ConfirmCustomPlugin
