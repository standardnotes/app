import Button from '@/Components/Button/Button'
import { FunctionComponent, useState, useRef, useEffect } from 'react'

type Props = {
  extensionName: string
  changeName: (newName: string) => void
  isThirdParty: boolean
}

const PackageEntrySubInfo: FunctionComponent<Props> = ({ extensionName, changeName, isThirdParty }) => {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newExtensionName, setNewExtensionName] = useState<string>(extensionName)

  const renameable = isThirdParty

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
    }
  }, [inputRef, isRenaming])

  const startRenaming = () => {
    setNewExtensionName(extensionName)
    setIsRenaming(true)
  }

  const cancelRename = () => {
    setNewExtensionName(extensionName)
    setIsRenaming(false)
  }

  const confirmRename = () => {
    if (!newExtensionName) {
      return
    }
    changeName(newExtensionName)
    setIsRenaming(false)
  }

  return (
    <div className="flex flex-row flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        disabled={!isRenaming || !renameable}
        autoComplete="off"
        className="no-border flex-grow bg-default px-0 text-base font-bold text-text"
        type="text"
        value={newExtensionName}
        onChange={({ target: input }) => setNewExtensionName((input as HTMLInputElement)?.value)}
      />

      {isRenaming && (
        <>
          <Button small className="cursor-pointer" onClick={confirmRename}>
            Confirm
          </Button>
          <Button small className="cursor-pointer" onClick={cancelRename}>
            Cancel
          </Button>
        </>
      )}

      {renameable && !isRenaming && (
        <Button small className="cursor-pointer" onClick={startRenaming}>
          Rename
        </Button>
      )}
    </div>
  )
}

export default PackageEntrySubInfo
