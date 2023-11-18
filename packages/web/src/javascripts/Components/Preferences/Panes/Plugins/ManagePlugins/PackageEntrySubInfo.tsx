import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import { FunctionComponent, useState, useRef, useEffect } from 'react'
import { AnyPackageType } from '../AnyPackageType'
import { ButtonType } from '@standardnotes/snjs'

type Props = {
  plugin: AnyPackageType
  changeName: (newName: string) => void
}

const PluginEntrySubInfo: FunctionComponent<Props> = ({ plugin, changeName }) => {
  const application = useApplication()

  const isThirdParty = 'identifier' in plugin && application.features.isThirdPartyFeature(plugin.identifier)

  const [isRenaming, setIsRenaming] = useState(false)
  const [newPluginName, setNewPluginName] = useState<string>(plugin.name)

  const renameable = isThirdParty

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
    }
  }, [inputRef, isRenaming])

  const startRenaming = () => {
    setNewPluginName(plugin.name)
    setIsRenaming(true)
  }

  const cancelRename = () => {
    setNewPluginName(plugin.name)
    setIsRenaming(false)
  }

  const confirmRename = () => {
    if (!newPluginName) {
      return
    }
    changeName(newPluginName)
    setIsRenaming(false)
  }

  const uninstall = async () => {
    application.alerts
      .confirm(
        'Are you sure you want to uninstall this plugin? Note that plugins managed by your subscription will automatically be re-installed on application restart.',
        'Uninstall Plugin?',
        'Uninstall',
        ButtonType.Danger,
        'Cancel',
      )
      .then(async (shouldRemove: boolean) => {
        if (shouldRemove) {
          await application.mutator.deleteItem(plugin)
          void application.sync.sync()
        }
      })
      .catch((err: string) => {
        application.alerts.alert(err).catch(console.error)
      })
  }

  return (
    <div className="align-center flex items-center justify-between md:items-center my-2.5">
      <input
        ref={inputRef}
        disabled={!isRenaming || !renameable}
        autoComplete="off"
        className="no-border flex-grow bg-default px-0 text-sm font-bold text-text mr-2 rounded-sm py-1"
        type="text"
        value={newPluginName}
        onChange={({ target: input }) => setNewPluginName((input as HTMLInputElement)?.value)}
      />

      {isRenaming && (
        <div className="flex gap-1">
          <Button small className="cursor-pointer" onClick={confirmRename}>
            Confirm
          </Button>
          <Button small className="cursor-pointer" onClick={cancelRename}>
            Cancel
          </Button>
        </div>
      )}

      {!isRenaming && (
        <div className="flex flex-row gap-1">
          {renameable && !isRenaming && (
            <Button small className="cursor-pointer" onClick={startRenaming}>
              Rename
            </Button>
          )}
          <Button small className="min-w-20" label={'Uninstall'} onClick={uninstall} />
        </div>
      )}
    </div>
  )
}

export default PluginEntrySubInfo
