import Icon from '@/Components/Icon/Icon'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import '@reach/tooltip/styles.css'
import { SmartView, SystemViewId, IconType, isSystemView } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import {
  FormEventHandler,
  FunctionComponent,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

type Props = {
  view: SmartView
  tagsState: NavigationController
  features: FeaturesController
}

const PADDING_BASE_PX = 14
const PADDING_PER_LEVEL_PX = 21

const smartViewIconType = (view: SmartView): IconType => {
  if (view.uuid === SystemViewId.AllNotes) {
    return 'notes'
  }
  if (view.uuid === SystemViewId.Files) {
    return 'file'
  }
  if (view.uuid === SystemViewId.ArchivedNotes) {
    return 'archive'
  }
  if (view.uuid === SystemViewId.TrashedNotes) {
    return 'trash'
  }
  if (view.uuid === SystemViewId.UntaggedNotes) {
    return 'hashtag-off'
  }

  return 'hashtag'
}

const SmartViewsListItem: FunctionComponent<Props> = ({ view, tagsState }) => {
  const [title, setTitle] = useState(view.title || '')
  const inputRef = useRef<HTMLInputElement>(null)

  const level = 0
  const isSelected = tagsState.selected === view
  const isEditing = tagsState.editingTag === view

  useEffect(() => {
    setTitle(view.title || '')
  }, [setTitle, view])

  const selectCurrentTag = useCallback(() => {
    void tagsState.setSelectedTag(view)
  }, [tagsState, view])

  const onBlur = useCallback(() => {
    tagsState.save(view, title).catch(console.error)
    setTitle(view.title)
  }, [tagsState, view, title, setTitle])

  const onInput: FormEventHandler = useCallback(
    (e) => {
      const value = (e.target as HTMLInputElement).value
      setTitle(value)
    },
    [setTitle],
  )

  const onKeyUp: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.code === 'Enter') {
        inputRef.current?.blur()
        e.preventDefault()
      }
    },
    [inputRef],
  )

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [inputRef, isEditing])

  const onClickRename = useCallback(() => {
    tagsState.editingTag = view
  }, [tagsState, view])

  const onClickSave = useCallback(() => {
    inputRef.current?.blur()
  }, [inputRef])

  const onClickDelete = useCallback(() => {
    tagsState.remove(view, true).catch(console.error)
  }, [tagsState, view])

  const isFaded = false
  const iconType = smartViewIconType(view)

  return (
    <>
      <div
        className={`tag ${isSelected ? 'selected' : ''} ${isFaded ? 'faded' : ''}`}
        onClick={selectCurrentTag}
        style={{
          paddingLeft: `${level * PADDING_PER_LEVEL_PX + PADDING_BASE_PX}px`,
        }}
      >
        <div className="tag-info">
          <div className={'tag-icon mr-1'}>
            <Icon type={iconType} className={`${isSelected ? 'color-info' : 'color-neutral'}`} />
          </div>
          <input
            className={`title ${isEditing ? 'editing' : ''}`}
            disabled={!isEditing}
            id={`react-tag-${view.uuid}`}
            onBlur={onBlur}
            onInput={onInput}
            value={title}
            onKeyUp={onKeyUp}
            spellCheck={false}
            ref={inputRef}
          />
          <div className="count">{view.uuid === SystemViewId.AllNotes && tagsState.allNotesCount}</div>
        </div>

        {!isSystemView(view) && (
          <div className="meta">
            {view.conflictOf && <div className="danger small-text font-bold">Conflicted Copy {view.conflictOf}</div>}

            {isSelected && (
              <div className="menu">
                {!isEditing && (
                  <a className="item" onClick={onClickRename}>
                    Rename
                  </a>
                )}
                {isEditing && (
                  <a className="item" onClick={onClickSave}>
                    Save
                  </a>
                )}
                <a className="item" onClick={onClickDelete}>
                  Delete
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default observer(SmartViewsListItem)
