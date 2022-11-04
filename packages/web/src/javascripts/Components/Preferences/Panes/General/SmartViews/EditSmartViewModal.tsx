import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import { SmartView } from '@standardnotes/snjs'
import SmartViewPredicate from './SmartViewPredicate'

type Props = {
  view: SmartView
  closeDialog: () => void
}

const EditSmartViewModal = ({ view, closeDialog }: Props) => {
  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={closeDialog}>Edit Smart View "{view.title}"</ModalDialogLabel>
      <ModalDialogDescription>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-sm font-semibold">Title:</div>
            <input className="rounded border border-border py-1 px-2" defaultValue={view.title} />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="text-sm font-semibold">Icon:</div>
            <div className="rounded border border-border p-2">
              <Icon type={view.iconString} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold">Predicate:</div>
            <div>
              <SmartViewPredicate predicate={view.predicate} />
            </div>
          </div>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button onClick={closeDialog}>Save</Button>
        <Button onClick={closeDialog}>Cancel</Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default EditSmartViewModal
