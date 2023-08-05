import { observer } from 'mobx-react-lite'
import { Fragment, FunctionComponent, useEffect, useState } from 'react'
import { Text, Title, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { ButtonType, ClientDisplayableError, ContentType, EncryptedItemInterface } from '@standardnotes/snjs'
import Button from '@/Components/Button/Button'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import { ErrorCircle } from '@/Components/UIElements/ErrorCircle'
import { useApplication } from '@/Components/ApplicationProvider'

const ErroredItems: FunctionComponent = () => {
  const application = useApplication()
  const [erroredItems, setErroredItems] = useState(application.items.invalidNonVaultedItems)

  useEffect(() => {
    return application.items.streamItems(ContentType.TYPES.Any, () => {
      setErroredItems(application.items.invalidNonVaultedItems)
    })
  }, [application])

  const getContentTypeDisplay = (item: EncryptedItemInterface): string => {
    const contentTypeOrError = ContentType.create(item.content_type)
    let display = null
    if (!contentTypeOrError.isFailed()) {
      display = contentTypeOrError.getValue().getDisplayName()
    }
    if (display) {
      return `${display[0].toUpperCase()}${display.slice(1)}`
    } else {
      return `Item of type ${item.content_type}`
    }
  }

  const deleteItem = async (item: EncryptedItemInterface): Promise<void> => {
    return deleteItems([item])
  }

  const deleteItems = async (items: EncryptedItemInterface[]): Promise<void> => {
    const confirmed = await application.alerts.confirm(
      `Are you sure you want to permanently delete ${items.length} item(s)?`,
      undefined,
      'Delete',
      ButtonType.Danger,
    )
    if (!confirmed) {
      return
    }

    void application.mutator.deleteItems(items).then(() => {
      void application.sync.sync()
    })

    setErroredItems(application.items.invalidItems)
  }

  const attemptDecryption = (item: EncryptedItemInterface): void => {
    const errorOrTrue = application.canAttemptDecryptionOfItem(item)

    if (errorOrTrue instanceof ClientDisplayableError) {
      void application.alerts.showErrorAlert(errorOrTrue)

      return
    }

    application.presentKeyRecoveryWizard()
  }

  if (erroredItems.length === 0) {
    return null
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title className="flex flex-row items-center gap-2">
          <ErrorCircle />
          Error decrypting items
        </Title>
        <Text>{`${erroredItems.length} items are errored and could not be decrypted.`}</Text>
        <div className="flex">
          <Button
            className="mr-2 mt-3 min-w-20"
            label="Export all"
            onClick={() => {
              void application.archiveService.downloadEncryptedItems(erroredItems)
            }}
          />
          <Button
            className="mr-2 mt-3 min-w-20"
            colorStyle="danger"
            label="Delete all"
            onClick={() => {
              void deleteItems(erroredItems)
            }}
          />
        </div>
        <HorizontalSeparator classes="mt-2.5 mb-3" />

        {erroredItems.map((item, index) => {
          return (
            <Fragment key={item.uuid}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Subtitle>{`${getContentTypeDisplay(item)} created on ${item.createdAtString}`}</Subtitle>
                  <Text>Item ID: {item.uuid}</Text>
                  <Text>Last Modified: {item.updatedAtString}</Text>
                  <div className="flex">
                    <Button
                      className="mr-2 mt-3 min-w-20"
                      label="Attempt decryption"
                      onClick={() => {
                        attemptDecryption(item)
                      }}
                    />
                    <Button
                      className="mr-2 mt-3 min-w-20"
                      label="Export"
                      onClick={() => {
                        void application.archiveService.downloadEncryptedItem(item)
                      }}
                    />
                    <Button
                      className="mr-2 mt-3 min-w-20"
                      colorStyle="danger"
                      label="Delete"
                      onClick={() => {
                        void deleteItem(item)
                      }}
                    />
                  </div>
                </div>
              </div>
              {index < erroredItems.length - 1 && <HorizontalSeparator classes="mt-2.5 mb-3" />}
            </Fragment>
          )
        })}
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(ErroredItems)
