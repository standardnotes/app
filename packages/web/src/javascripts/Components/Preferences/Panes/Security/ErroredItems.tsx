import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { Fragment, FunctionComponent, useState } from 'react'
import { Text, Title, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import {
  ButtonType,
  ClientDisplayableError,
  DisplayStringForContentType,
  EncryptedItemInterface,
} from '@standardnotes/snjs'
import Button from '@/Components/Button/Button'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'

type Props = { viewControllerManager: ViewControllerManager }

const ErroredItems: FunctionComponent<Props> = ({ viewControllerManager }: Props) => {
  const app = viewControllerManager.application

  const [erroredItems, setErroredItems] = useState(app.items.invalidItems)

  const getContentTypeDisplay = (item: EncryptedItemInterface): string => {
    const display = DisplayStringForContentType(item.content_type)
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
    const confirmed = await app.alertService.confirm(
      `Are you sure you want to permanently delete ${items.length} item(s)?`,
      undefined,
      'Delete',
      ButtonType.Danger,
    )
    if (!confirmed) {
      return
    }

    void app.mutator.deleteItems(items)

    setErroredItems(app.items.invalidItems)
  }

  const attemptDecryption = (item: EncryptedItemInterface): void => {
    const errorOrTrue = app.canAttemptDecryptionOfItem(item)

    if (errorOrTrue instanceof ClientDisplayableError) {
      void app.alertService.showErrorAlert(errorOrTrue)

      return
    }

    app.presentKeyRecoveryWizard()
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>
          Error Decrypting Items <span className="ml-1 text-warning">⚠️</span>
        </Title>
        <Text>{`${erroredItems.length} items are errored and could not be decrypted.`}</Text>
        <div className="flex">
          <Button
            className="mt-3 mr-2 min-w-20"
            label="Export all"
            onClick={() => {
              void app.getArchiveService().downloadEncryptedItems(erroredItems)
            }}
          />
          <Button
            className="mt-3 mr-2 min-w-20"
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
                  <Text>
                    <div>Item ID: {item.uuid}</div>
                    <div>Last Modified: {item.updatedAtString}</div>
                  </Text>
                  <div className="flex">
                    <Button
                      className="mt-3 mr-2 min-w-20"
                      label="Attempt decryption"
                      onClick={() => {
                        attemptDecryption(item)
                      }}
                    />
                    <Button
                      className="mt-3 mr-2 min-w-20"
                      label="Export"
                      onClick={() => {
                        void app.getArchiveService().downloadEncryptedItem(item)
                      }}
                    />
                    <Button
                      className="mt-3 mr-2 min-w-20"
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
