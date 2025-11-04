import AlertDialog from '@/Components/AlertDialog/AlertDialog'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import { FunctionComponent } from 'react'

type Props = {
  onClose: () => void
  onConfirm: () => void
}

const ConfirmNoMergeDialog: FunctionComponent<Props> = ({ onClose, onConfirm }) => {
  return (
    <AlertDialog closeDialog={onClose}>
      <div className="flex items-center justify-between text-lg font-bold">
        Delete local data?
        <button className="rounded p-1 font-bold hover:bg-contrast" onClick={onClose}>
          <Icon type="close" />
        </button>
      </div>
      <div className="sk-panel-row">
        <div>
          <p className="text-base text-foreground lg:text-sm">
            You have chosen not to merge your local data. If you proceed, your local notes and tags will be permanently
            deleted and replaced with data from your account. This action cannot be undone.
          </p>
          <p className="mt-2 text-base font-semibold text-danger lg:text-sm">
            Are you sure you want to continue without merging?
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button primary colorStyle="danger" onClick={onConfirm}>
          Delete Local Data and Continue
        </Button>
      </div>
    </AlertDialog>
  )
}

export default ConfirmNoMergeDialog
