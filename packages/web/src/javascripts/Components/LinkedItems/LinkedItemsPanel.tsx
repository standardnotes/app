import { FeaturesController } from '@/Controllers/FeaturesController'
import { FilesController } from '@/Controllers/FilesController'
import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { FileItem } from '@standardnotes/snjs'
import { KeyboardKey } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, useEffect, useRef, useState } from 'react'
import { PopoverFileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import MenuItem from '../Menu/MenuItem'
import { MenuItemType } from '../Menu/MenuItemType'
import Popover from '../Popover/Popover'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import LinkedFileMenuOptions from './LinkedFileMenuOptions'
import LinkedItemMeta from './LinkedItemMeta'
import LinkedItemSearchResults from './LinkedItemSearchResults'

const LinkedItemsSectionItem = ({
  activateItem,
  getItemIcon,
  getTitleForLinkedTag,
  item,
  searchQuery,
  unlinkItem,
  handleFileAction,
}: {
  activateItem: LinkingController['activateItem']
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  item: LinkableItem
  searchQuery?: string
  unlinkItem: () => void
  handleFileAction: FilesController['handleFileAction']
}) => {
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleMenu = () => setIsMenuOpen((open) => !open)

  const [isRenamingFile, setIsRenamingFile] = useState(false)

  const [icon, className] = getItemIcon(item)
  const title = item.title ?? ''

  const renameFile = async (name: string) => {
    if (!(item instanceof FileItem)) {
      return
    }
    await handleFileAction({
      type: PopoverFileItemActionType.RenameFile,
      payload: {
        file: item,
        name: name,
      },
    })
    setIsRenamingFile(false)
  }

  return (
    <div className="relative flex items-center justify-between">
      {isRenamingFile && item instanceof FileItem ? (
        <div className="flex flex-grow items-center gap-4 py-2 pl-3 pr-12">
          <Icon type={icon} className={classNames('flex-shrink-0', className)} />
          <input
            className="min-w-0 flex-grow text-sm"
            defaultValue={title}
            onKeyDown={(event) => {
              if (event.key === KeyboardKey.Escape) {
                setIsRenamingFile(false)
              } else if (event.key === KeyboardKey.Enter) {
                const newTitle = event.currentTarget.value
                void renameFile(newTitle)
              }
            }}
            ref={(node) => {
              if (node) {
                node.focus()
              }
            }}
          />
        </div>
      ) : (
        <button
          className="flex max-w-full flex-grow items-center justify-between gap-4 py-2 pl-3 pr-12 text-sm hover:bg-info-backdrop focus:bg-info-backdrop"
          onClick={() => activateItem(item)}
          onContextMenu={(event) => {
            event.preventDefault()
            toggleMenu()
          }}
        >
          <LinkedItemMeta
            item={item}
            getItemIcon={getItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
            searchQuery={searchQuery}
          />
        </button>
      )}
      <button
        className="absolute right-3 top-1/2 h-7 w-7 -translate-y-1/2 cursor-pointer rounded-full border-0 bg-transparent p-1 hover:bg-contrast"
        onClick={toggleMenu}
        ref={menuButtonRef}
      >
        <Icon type="more" className="text-neutral" />
      </button>
      <Popover
        open={isMenuOpen}
        togglePopover={toggleMenu}
        anchorElement={menuButtonRef.current}
        side="bottom"
        align="center"
        className="py-2"
      >
        <MenuItem
          type={MenuItemType.IconButton}
          onClick={() => {
            unlinkItem()
            toggleMenu()
          }}
        >
          <Icon type="link-off" className="mr-2 text-danger" />
          Unlink
        </MenuItem>
        {item instanceof FileItem && (
          <LinkedFileMenuOptions
            file={item}
            closeMenu={toggleMenu}
            handleFileAction={handleFileAction}
            setIsRenamingFile={setIsRenamingFile}
          />
        )}
        <HorizontalSeparator classes="my-2" />
        <div className="mt-1 px-3 py-1 text-xs font-medium text-neutral">
          <div className="mb-1">
            <span className="font-semibold">Created at:</span> {formatDateForContextMenu(item.created_at)}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Modified at:</span> {formatDateForContextMenu(item.userModifiedDate)}
          </div>
          <div className="mb-1">
            <span className="font-semibold">ID:</span> {item.uuid}
          </div>
          {item instanceof FileItem && (
            <div>
              <span className="font-semibold">Size:</span> {formatSizeToReadableString(item.decryptedSize)}
            </div>
          )}
        </div>
      </Popover>
    </div>
  )
}

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
    getTitleForLinkedTag,
    getLinkedItemIcon,
    getSearchResults,
    linkItemToSelectedItem,
    unlinkItemFromSelectedItem,
    activateItem,
    createAndAddNewTag,
    isEntitledToNoteLinking,
  } = linkingController

  const { hasFiles } = featuresController

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const isSearching = !!searchQuery.length
  const { linkedResults, unlinkedResults, shouldShowCreateTag } = getSearchResults(searchQuery)

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
      filesController.uploadNewFile(files[i]).then((uploadedFiles) => {
        if (uploadedFiles) {
          void linkItemToSelectedItem(uploadedFiles[0])
        }
      })
    }
  }

  const selectAndUploadFiles = () => {
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
          allLinkedItems.length || linkedResults.length || unlinkedResults.length || notesLinkingToActiveItem.length
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
            {(!!unlinkedResults.length || shouldShowCreateTag) && (
              <div>
                <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Unlinked</div>
                <LinkedItemSearchResults
                  createAndAddNewTag={createAndAddNewTag}
                  getLinkedItemIcon={getLinkedItemIcon}
                  getTitleForLinkedTag={getTitleForLinkedTag}
                  linkItemToSelectedItem={linkItemToSelectedItem}
                  results={unlinkedResults}
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
                      getItemIcon={getLinkedItemIcon}
                      getTitleForLinkedTag={getTitleForLinkedTag}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link)}
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
                      getItemIcon={getLinkedItemIcon}
                      getTitleForLinkedTag={getTitleForLinkedTag}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link)}
                      activateItem={activateItem}
                      handleFileAction={filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}
            {(!!linkedFiles.length || hasFiles) && (
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
                    className="flex w-full cursor-pointer items-center gap-3 bg-transparent px-3 py-2 text-left text-sm text-text hover:bg-info-backdrop hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
                    onClick={selectAndUploadFiles}
                  >
                    <Icon type="add" />
                    Upload and link file(s)
                  </button>
                  {linkedFiles.map((link) => (
                    <LinkedItemsSectionItem
                      key={link.id}
                      item={link.item}
                      getItemIcon={getLinkedItemIcon}
                      getTitleForLinkedTag={getTitleForLinkedTag}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link)}
                      activateItem={activateItem}
                      handleFileAction={filesController.handleFileAction}
                    />
                  ))}
                </div>
              </div>
            )}
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
                      getItemIcon={getLinkedItemIcon}
                      getTitleForLinkedTag={getTitleForLinkedTag}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link)}
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
                      getItemIcon={getLinkedItemIcon}
                      getTitleForLinkedTag={getTitleForLinkedTag}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link)}
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
                      getItemIcon={getLinkedItemIcon}
                      getTitleForLinkedTag={getTitleForLinkedTag}
                      searchQuery={searchQuery}
                      unlinkItem={() => unlinkItemFromSelectedItem(link)}
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
