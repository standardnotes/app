import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import { SmartView } from '@standardnotes/snjs'

type Props = {
  view: SmartView
  onEdit: () => void
  onDelete: () => void
}

const SmartViewItem = ({ view, onEdit, onDelete }: Props) => {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon type={view.iconString} size="custom" className="h-5.5 w-5.5" />
      <span className="mr-auto text-sm">{view.title}</span>
      <Button small onClick={onEdit}>
        Edit
      </Button>
      <Button small onClick={onDelete}>
        Delete
      </Button>
    </div>
  )
}

export default SmartViewItem
