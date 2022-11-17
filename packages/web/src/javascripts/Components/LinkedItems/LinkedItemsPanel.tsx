import { FeatureName } from '@/Controllers/FeatureName'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { FilesController } from '@/Controllers/FilesController'
import { LinkingController } from '@/Controllers/LinkingController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { getLinkingSearchResults } from '@/Utils/Items/Search/getSearchResults'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, useEffect, useRef, useState } from 'react'
import { useApplication } from '../ApplicationView/ApplicationProvider'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import LinkedItemSearchResults from './LinkedItemSearchResults'
import { LinkedItemsSectionItem } from './LinkedItemsSectionItem'

const LinkedItemsPanel = ({
  linkingController,
  filesController,
  featuresController,
  isOpen,
}: {
  linkingController: LinkingController
  filesController: FilesController
  featuresController: FeaturesController
  isOpen: boolean
}) => {
  const {
    tags,
    linkedFiles,
    filesLinkingToActiveItem,
    notesLinkedToItem,
    notesLinkingToActiveItem,
    allItemLinks: allLinkedItems,
    linkItemToSelectedItem,
    unlinkItemFromSelectedItem,
    activateItem,
    createAndAddNewTag,
    isEntitledToNoteLinking,
    activeItem,
  } = linkingController

  const { entitledToFiles } = featuresController
  const application = useApplication()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const isSearching = !!searchQuery.length
  const { linkedResults, unlinkedItems, shouldShowCreateTag } = getLinkingSearchResults(
    searchQuery,
    application,
    activeItem,
  )

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleFileInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = event.currentTarget.files

    if (!files) {
      return
    }

    for (let i = 0; i < files.length; i++) {
      void filesController.uploadNewFile(files[i]).then((uploadedFiles) => {
        if (uploadedFiles) {
          void linkItemToSelectedItem(uploadedFiles[0])
        }
      })
    }
  }

  const selectAndUploadFiles = () => {
    if (!entitledToFiles) {
      void featuresController.showPremiumAlert(FeatureName.Files)
      return
    }

    if (!fileInputRef.current) {
      return
    }

    fileInputRef.current.click()
  }

  return (
    <div>
      <form
        className={classNames(
          'sticky top-0 z-10 bg-default px-2.5 pt-2.5',
          allLinkedItems.length || linkedResults.length || unlinkedItems.length || notesLinkingToActiveItem.length
            ? 'border-b border-border pb-2.5'
            : 'pb-1',
        )}
      >
        <DecoratedInput
          type="text"
          className={{ container: !isSearching ? 'py-1.5 px-0.5' : 'py-0', input: 'placeholder:text-passive-0' }}
          placeholder="Search items to link..."
          value={searchQuery}
          onChange={setSearchQuery}
          ref={searchInputRef}
          right={[
            isSearching && (
              <ClearInputButton
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
              />
            ),
          ]}
        />
      </form>
      <div className="divide-y divide-border">
        {isSearching ? (
          <>
            {(!!unlinkedItems.length || shouldShowCreateTag) && (
              <div>
                <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Unlinked</div>
                <LinkedItemSearchResults
                  createAndAddNewTag={createAndAddNewTag}
                  linkItemToSelectedItem={linkItemToSelectedItem}
                  results={unlinkedItems}
                  searchQuery={searchQuery}
                  shouldShowCreateTag={shouldShowCreateTag}
                  isEntitledToNoteLinking={isEntitledToNoteLinking}
                  onClickCallback={() => {
                    setSearchQuery('')
                    searchInputRef.current?.focus()
                  }}
                />
              </div>
            )}
            {!!linkedResults.length && (
              <div>
                <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked</div>
                <div className="my-1">
                  {linkedResults.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link.item)}
                      activateItem={activateItem}
                      handleFileAction={filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {!!tags.length && (
              <div>
                <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked Tags</div>
                <div className="my-1">
                  {tags.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link.item)}
                      activateItem={activateItem}
                      handleFileAction={filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked Files</div>
              <div className="my-1">
                <input
                  type="file"
                  className="absolute top-0 left-0 -z-50 h-px w-px opacity-0"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                />
                <button
                  className="flex w-full cursor-pointer items-center gap-3 bg-transparent px-3 py-2 text-left text-base text-text hover:bg-info-backdrop hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-sm"
                  onClick={selectAndUploadFiles}
                >
                  <Icon type="add" />
                  Upload and link file(s)
                </button>
                {linkedFiles.map((link) => (
                  <LinkedItemsSectionItem
                    key={link.id}
                    item={link.item}
                    searchQuery={searchQuery}
                    unlinkItem={() => unlinkItemFromSelectedItem(link.item)}
                    activateItem={activateItem}
                    handleFileAction={filesController.handleFileAction}
                  />
                ))}
              </div>
            </div>

            {!!filesLinkingToActiveItem.length && (
              <div>
                <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">
                  Files Linking To Current File
                </div>
                <div className="my-1">
                  {filesLinkingToActiveItem.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link.item)}
                      activateItem={activateItem}
                      handleFileAction={filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}
            {!!notesLinkedToItem.length && (
              <div>
                <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked Notes</div>
                <div className="my-1">
                  {notesLinkedToItem.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link.item)}
                      activateItem={activateItem}
                      handleFileAction={filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}
            {!!notesLinkingToActiveItem.length && (
              <div>
                <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">
                  Notes Linking To This Note
                </div>
                <div className="my-1">
                  {notesLinkingToActiveItem.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link.item)}
                      activateItem={activateItem}
                      handleFileAction={filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default observer(LinkedItemsPanel)
