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
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'

type Props = {
  view: SmartView
  tagsState: NavigationController
  features: FeaturesController
}

const PADDING_BASE_PX = 14
const PADDING_PER_LEVEL_PX = 21

const smartViewIconType = (view: SmartView, isSelected: boolean): IconType => {
  const mapping: Record<SystemViewId, IconType> = {
    [SystemViewId.AllNotes]: isSelected ? 'notes-filled' : 'notes',
    [SystemViewId.Files]: 'folder',
    [SystemViewId.ArchivedNotes]: 'archive',
    [SystemViewId.TrashedNotes]: 'trash',
    [SystemViewId.UntaggedNotes]: 'hashtag-off',
    [SystemViewId.StarredNotes]: 'star-filled',
  }

  return mapping[view.uuid as SystemViewId] || 'window'
}

const getIconClass = (view: SmartView, isSelected: boolean): string => {
  const mapping: Partial<Record<SystemViewId, string>> = {
    [SystemViewId.StarredNotes]: 'text-warning',
  }

  return mapping[view.uuid as SystemViewId] || (isSelected ? 'text-info' : 'text-neutral')
}

const SmartViewsListItem: FunctionComponent<Props> = ({ view, tagsState }) => {
  const { toggleAppPane } = useResponsiveAppPane()

  const [title, setTitle] = useState(view.title || '')
  const inputRef = useRef<HTMLInputElement>(null)

  const level = 0
  const isSelected = tagsState.selected === view
  const isEditing = tagsState.editingTag === view

  useEffect(() => {
    setTitle(view.title || '')
  }, [setTitle, view])

  const selectCurrentTag = useCallback(async () => {
    await tagsState.setSelectedTag(view, {
      userTriggered: true,
    })
    toggleAppPane(AppPaneId.Items)
  }, [tagsState, toggleAppPane, view])

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
  const iconType = smartViewIconType(view, isSelected)
  const iconClass = getIconClass(view, isSelected)

  return (
    <>
      <div
        role="button"
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
        className={classNames('tag py-2 px-3.5 md:py-1', isSelected && 'selected', isFaded && 'opacity-50')}
        onClick={selectCurrentTag}
        style={{
          paddingLeft: `${level * PADDING_PER_LEVEL_PX + PADDING_BASE_PX}px`,
        }}
      >
        <div className="tag-info">
          <div className={'tag-icon mr-2'}>
            <Icon type={iconType} className={iconClass} />
          </div>
          {isEditing ? (
            <input
              className={'title editing'}
              id={`react-tag-${view.uuid}`}
              onBlur={onBlur}
              onInput={onInput}
              value={title}
              onKeyUp={onKeyUp}
              spellCheck={false}
              ref={inputRef}
            />
          ) : (
            <div className={'title overflow-hidden text-left'} id={`react-tag-${view.uuid}`}>
              {title}
            </div>
          )}
          <div className={'count'}>{view.uuid === SystemViewId.AllNotes && tagsState.allNotesCount}</div>
        </div>

        {!isSystemView(view) && (
          <div className="meta">
            {view.conflictOf && (
              <div className="danger text-[0.625rem] font-bold">Conflicted Copy {view.conflictOf}</div>
            )}

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
