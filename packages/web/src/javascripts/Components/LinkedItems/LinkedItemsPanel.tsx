import { FeatureName } from '@/Controllers/FeatureName'
import { classNames } from '@standardnotes/utils'
import { getLinkingSearchResults } from '@/Utils/Items/Search/getSearchResults'
import { observer } from 'mobx-react-lite'
import { useCallback, useRef, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import LinkedItemSearchResults from './LinkedItemSearchResults'
import { LinkedItemsSectionItem } from './LinkedItemsSectionItem'
import { DecryptedItem, SNNote } from '@standardnotes/snjs'
import { useItemLinks } from '@/Hooks/useItemLinks'
import { mergeRefs } from '@/Hooks/mergeRefs'

const LinkedItemsPanel = ({ item }: { item: DecryptedItem }) => {
  const application = useApplication()

  const { linkItems, unlinkItems, activateItem, createAndAddNewTag, isEntitledToNoteLinking } =
    application.linkingController

  const { notesLinkedToItem, notesLinkingToItem, filesLinkedToItem, filesLinkingToItem, tagsLinkedToItem } =
    useItemLinks(item)

  const { entitledToFiles } = application.featuresController

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const isSearching = !!searchQuery.length
  const { linkedResults, unlinkedItems, shouldShowCreateTag } = getLinkingSearchResults(searchQuery, application, item)

  const focusInput = useCallback((element: HTMLInputElement | null) => {
    if (element) {
      element.focus()
    }
  }, [])

  const selectAndUploadFiles = async () => {
    if (!entitledToFiles) {
      void application.featuresController.showPremiumAlert(FeatureName.Files)
      return
    }

    void application.filesController.selectAndUploadNewFiles(item instanceof SNNote ? item : undefined, (file) => {
      void linkItems(item, file)
    })
  }

  return (
    <div>
      <form
        className={classNames(
          'sticky top-0 z-10 bg-default px-2.5 pt-2.5 md:translucent-ui:bg-transparent',
          linkedResults.length || unlinkedItems.length || notesLinkingToItem.length
            ? 'border-b border-border pb-2.5'
            : 'pb-1',
        )}
      >
        <DecoratedInput
          type="text"
          className={{
            container: classNames(!isSearching ? 'px-0.5 py-1.5' : 'py-0', 'md:translucent-ui:bg-default'),
            input: 'placeholder:text-passive-0',
          }}
          placeholder="Search items to link..."
          value={searchQuery}
          onChange={setSearchQuery}
          ref={mergeRefs([focusInput, searchInputRef])}
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
                <div className="mb-1 mt-3 px-3 text-menu-item font-semibold uppercase text-passive-0">Unlinked</div>
                <LinkedItemSearchResults
                  createAndAddNewTag={createAndAddNewTag}
                  linkItems={linkItems}
                  results={unlinkedItems}
                  searchQuery={searchQuery}
                  shouldShowCreateTag={shouldShowCreateTag}
                  isEntitledToNoteLinking={isEntitledToNoteLinking}
                  onClickCallback={() => {
                    setSearchQuery('')
                    searchInputRef.current?.focus()
                  }}
                  item={item}
                />
              </div>
            )}
            {!!linkedResults.length && (
              <div>
                <div className="mb-1 mt-3 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked</div>
                <div className="my-1">
                  {linkedResults.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItems(item, link.item)}
                      activateItem={activateItem}
                      handleFileAction={application.filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {!!tagsLinkedToItem.length && (
              <div>
                <div className="mb-1 mt-3 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked Tags</div>
                <div className="my-1">
                  {tagsLinkedToItem.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItems(item, link.item)}
                      activateItem={activateItem}
                      handleFileAction={application.filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-1 mt-3 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked Files</div>
              <div className="my-1">
                <button
                  className="flex w-full cursor-pointer items-center gap-3 bg-transparent px-3 py-2 text-left text-base text-text hover:bg-info-backdrop hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-sm"
                  onClick={selectAndUploadFiles}
                >
                  <Icon type="add" />
                  Upload and link file(s)
                </button>
                {filesLinkedToItem.map((link) => (
                  <LinkedItemsSectionItem
                    key={link.id}
                    item={link.item}
                    searchQuery={searchQuery}
                    unlinkItem={() => unlinkItems(item, link.item)}
                    activateItem={activateItem}
                    handleFileAction={application.filesController.handleFileAction}
                  />
                ))}
              </div>
            </div>

            {!!filesLinkingToItem.length && (
              <div>
                <div className="mb-1 mt-3 px-3 text-menu-item font-semibold uppercase text-passive-0">
                  Files Linking To Current File
                </div>
                <div className="my-1">
                  {filesLinkingToItem.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItems(item, link.item)}
                      activateItem={activateItem}
                      handleFileAction={application.filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}
            {!!notesLinkedToItem.length && (
              <div>
                <div className="mb-1 mt-3 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked Notes</div>
                <div className="my-1">
                  {notesLinkedToItem.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItems(item, link.item)}
                      activateItem={activateItem}
                      handleFileAction={application.filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}
            {!!notesLinkingToItem.length && (
              <div>
                <div className="mb-1 mt-3 px-3 text-menu-item font-semibold uppercase text-passive-0">
                  Notes Linking To This Note
                </div>
                <div className="my-1">
                  {notesLinkingToItem.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItems(item, link.item)}
                      activateItem={activateItem}
                      handleFileAction={application.filesController.handleFileAction}
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
