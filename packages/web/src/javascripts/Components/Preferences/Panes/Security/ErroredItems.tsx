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
import { c } from 'ttag'

const jtString = (value: unknown): string => (Array.isArray(value) ? value.join('') : String(value))

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
      return jtString(c('B6.Preferences.Security.Info').jt`Item of type ${item.content_type}`)
    }
  }

  const deleteItem = async (item: EncryptedItemInterface): Promise<void> => {
    return deleteItems([item])
  }

  const deleteItems = async (items: EncryptedItemInterface[]): Promise<void> => {
    const count = items.length
    const confirmed = await application.alerts.confirm(
      jtString(
        c('B6.Preferences.Security.Confirmation').jt`Are you sure you want to permanently delete ${count} item(s)?`,
      ),
      undefined,
      c('B6.Preferences.Security.Confirmation').t`Delete`,
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
          {c('B6.Preferences.Security.Title').t`Error decrypting items`}
        </Title>
        <Text>
          {jtString(
            c('B6.Preferences.Security.Error').jt`${erroredItems.length} items are errored and could not be decrypted.`,
          )}
        </Text>
        <div className="flex">
          <Button
            className="mr-2 mt-3 min-w-20"
            label={c('B6.Preferences.Security.Action').t`Export all`}
            onClick={() => {
              void application.archiveService.downloadEncryptedItems(erroredItems)
            }}
          />
          <Button
            className="mr-2 mt-3 min-w-20"
            colorStyle="danger"
            label={c('B6.Preferences.Security.Action').t`Delete all`}
            onClick={() => {
              void deleteItems(erroredItems)
            }}
          />
        </div>
        <HorizontalSeparator classes="mt-2.5 mb-3" />

        {erroredItems.map((item, index) => {
          const contentTypeDisplay = getContentTypeDisplay(item)
          const createdAtString = item.createdAtString
          const itemUuid = item.uuid
          const updatedAtString = item.updatedAtString

          return (
            <Fragment key={item.uuid}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Subtitle>
                    {jtString(
                      c('B6.Preferences.Security.Info').jt`${contentTypeDisplay} created on ${createdAtString}`,
                    )}
                  </Subtitle>
                  <Text>{jtString(c('B6.Preferences.Security.Info').jt`Item ID: ${itemUuid}`)}</Text>
                  <Text>{jtString(c('B6.Preferences.Security.Info').jt`Last Modified: ${updatedAtString}`)}</Text>
                  <div className="flex">
                    <Button
                      className="mr-2 mt-3 min-w-20"
                      label={c('B6.Preferences.Security.Action').t`Attempt decryption`}
                      onClick={() => {
                        attemptDecryption(item)
                      }}
                    />
                    <Button
                      className="mr-2 mt-3 min-w-20"
                      label={c('B6.Preferences.Security.Action').t`Export`}
                      onClick={() => {
                        void application.archiveService.downloadEncryptedItem(item)
                      }}
                    />
                    <Button
                      className="mr-2 mt-3 min-w-20"
                      colorStyle="danger"
                      label={c('B6.Preferences.Security.Action').t`Delete`}
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
