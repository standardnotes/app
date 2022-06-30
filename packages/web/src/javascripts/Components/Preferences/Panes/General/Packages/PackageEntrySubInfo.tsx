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
    <div className="mr-3 flex flex-row items-center">
      <input
        ref={inputRef}
        disabled={!isRenaming || !renameable}
        autoComplete="off"
        className="no-border flex-grow bg-default px-0 text-base font-bold text-text"
        type="text"
        value={newExtensionName}
        onChange={({ target: input }) => setNewExtensionName((input as HTMLInputElement)?.value)}
      />

      <div className="min-w-3" />

      {isRenaming && (
        <>
          <a className="cursor-pointer pt-1" onClick={confirmRename}>
            Confirm
          </a>
          <div className="min-w-3" />
          <a className="cursor-pointer pt-1" onClick={cancelRename}>
            Cancel
          </a>
        </>
      )}

      {renameable && !isRenaming && (
        <a className="cursor-pointer pt-1" onClick={startRenaming}>
          Rename
        </a>
      )}
    </div>
  )
}

export default PackageEntrySubInfo
