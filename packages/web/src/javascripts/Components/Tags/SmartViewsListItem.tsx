import Icon from '@/Components/Icon/Icon'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { ContentType, SmartView, SystemViewId, isSystemView } from '@standardnotes/snjs'
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
import { classNames } from '@standardnotes/utils'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useApplication } from '../ApplicationProvider'

type Props = {
  view: SmartView
  tagsState: NavigationController
  features: FeaturesController
  setEditingSmartView: (smartView: SmartView) => void
}

const PADDING_BASE_PX = 14
const PADDING_PER_LEVEL_PX = 21

const getIconClass = (view: SmartView, isSelected: boolean): string => {
  const mapping: Partial<Record<SystemViewId, string>> = {
    [SystemViewId.StarredNotes]: 'text-warning',
  }

  return mapping[view.uuid as SystemViewId] || (isSelected ? 'text-info' : 'text-neutral')
}

const SmartViewsListItem: FunctionComponent<Props> = ({ view, tagsState, setEditingSmartView }) => {
  const application = useApplication()

  const [title, setTitle] = useState(view.title || '')
  const inputRef = useRef<HTMLInputElement>(null)

  const level = 0
  const isSelected = tagsState.selected === view
  const isEditing = tagsState.editingTag === view

  useEffect(() => {
    setTitle(view.title || '')
  }, [setTitle, view])

  const selectCurrentTag = useCallback(async () => {
    await tagsState.setSelectedTag(view, 'views', {
      userTriggered: true,
    })
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

  const onClickEdit = useCallback(() => {
    setEditingSmartView(view)
  }, [setEditingSmartView, view])

  const onClickDelete = useCallback(() => {
    tagsState.remove(view, true).catch(console.error)
  }, [tagsState, view])

  const isFaded = false
  const iconClass = getIconClass(view, isSelected)

  const [conflictsCount, setConflictsCount] = useState(0)

  useEffect(() => {
    if (view.uuid !== SystemViewId.Conflicts) {
      return
    }

    return application.items.streamItems(ContentType.TYPES.Note, () => {
      setConflictsCount(application.items.numberOfNotesWithConflicts())
    })
  }, [application, view])

  if (view.uuid === SystemViewId.Conflicts && !conflictsCount) {
    return null
  }

  return (
    <button
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      className={classNames(
        'tag group px-3.5 py-0.5 focus-visible:!shadow-inner md:py-0',
        isSelected && 'selected',
        isFaded && 'opacity-50',
      )}
      onClick={selectCurrentTag}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (isSystemView(view)) {
          return
        }
        onClickEdit()
      }}
      style={{
        paddingLeft: `${level * PADDING_PER_LEVEL_PX + PADDING_BASE_PX}px`,
      }}
    >
      <div className="tag-info">
        <div className={'tag-icon mr-2'}>
          <Icon type={view.iconString} className={classNames(iconClass, 'group-hover:text-text')} />
        </div>
        {isEditing ? (
          <input
            className={'title editing text-mobile-navigation-list-item lg:text-navigation-list-item'}
            id={`react-tag-${view.uuid}`}
            onBlur={onBlur}
            onInput={onInput}
            value={title}
            onKeyUp={onKeyUp}
            spellCheck={false}
            ref={inputRef}
          />
        ) : (
          <div
            className={'title overflow-hidden text-left text-mobile-navigation-list-item lg:text-navigation-list-item'}
            id={`react-tag-${view.uuid}`}
          >
            {title}
          </div>
        )}
        <div className={'count text-base lg:text-sm'}>
          {view.uuid === SystemViewId.AllNotes && tagsState.allNotesCount}
          {view.uuid === SystemViewId.Files && tagsState.allFilesCount}
          {view.uuid === SystemViewId.Conflicts && conflictsCount}
        </div>
      </div>

      {!isSystemView(view) && (
        <div className="meta">
          {view.conflictOf && <div className="-mt-1 text-[0.625rem] font-bold text-danger">Conflicted Copy</div>}

          {isSelected && (
            <div className="menu">
              <a className="item" onClick={onClickEdit}>
                Edit
              </a>
              <a className="item" onClick={onClickDelete}>
                Delete
              </a>
            </div>
          )}
        </div>
      )}
    </button>
  )
}

export default observer(SmartViewsListItem)
