import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import { SmartView } from '@standardnotes/snjs'
import { useCallback } from 'react'

type Props = {
  view: SmartView
  onEdit: () => void
  onDelete: (view: SmartView) => void
}

const SmartViewItem = ({ view, onEdit, onDelete }: Props) => {
  const onClickDelete = useCallback(() => onDelete(view), [onDelete, view])

  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon type={view.iconString} size="custom" className="h-5.5 w-5.5 flex-shrink-0" />
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{view.title}</span>
      <Button small onClick={onEdit}>
        Edit
      </Button>
      <Button small onClick={onClickDelete}>
        Delete
      </Button>
    </div>
  )
}

export default SmartViewItem
