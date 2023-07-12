import { FilesIllustration } from '@standardnotes/icons'
import Button from '../Button/Button'

type Props = {
  addNewItem: () => void
}

const EmptyFilesView = ({ addNewItem }: Props) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <FilesIllustration className="h-32 w-32" />
      <div className="mb-2 mt-4 text-lg font-bold">You don't have any files yet</div>
      <div className="mb-4 max-w-[35ch] text-center text-sm text-passive-0">
        Files attached to your notes appear here. You can also upload files directly from this page.
      </div>
      <Button primary onClick={addNewItem}>
        Upload files
      </Button>
    </div>
  )
}

export default EmptyFilesView
