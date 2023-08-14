import { FilesController } from '@/Controllers/FilesController'
import { LinkingController } from '@/Controllers/LinkingController'
import { classNames } from '@standardnotes/utils'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { getIconForItem } from '@/Utils/Items/Icons/getIconForItem'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { FileItem } from '@standardnotes/snjs'
import { KeyboardKey } from '@standardnotes/ui-services'
import { useRef, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import { FileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import Icon from '../Icon/Icon'
import MenuItem from '../Menu/MenuItem'
import Popover from '../Popover/Popover'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import LinkedFileMenuOptions from './LinkedFileMenuOptions'
import LinkedItemMeta from './LinkedItemMeta'

export const LinkedItemsSectionItem = ({
  activateItem,
  item,
  searchQuery,
  unlinkItem,
  handleFileAction,
}: {
  activateItem: LinkingController['activateItem']
  item: LinkableItem
  searchQuery?: string
  unlinkItem: () => void
  handleFileAction: FilesController['handleFileAction']
}) => {
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const application = useApplication()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleMenu = () => setIsMenuOpen((open) => !open)

  const [isRenamingFile, setIsRenamingFile] = useState(false)

  const [icon, className] = getIconForItem(item, application)
  const title = item.title ?? ''

  const renameFile = async (name: string) => {
    if (!(item instanceof FileItem)) {
      return
    }
    await handleFileAction({
      type: FileItemActionType.RenameFile,
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
            className="min-w-0 flex-grow bg-default text-sm"
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
          <LinkedItemMeta item={item} searchQuery={searchQuery} />
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
        title="Options"
        open={isMenuOpen}
        togglePopover={toggleMenu}
        anchorElement={menuButtonRef}
        side="bottom"
        align="center"
        className="py-2"
      >
        <MenuItem
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
