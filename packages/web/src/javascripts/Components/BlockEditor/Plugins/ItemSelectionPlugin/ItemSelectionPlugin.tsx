import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalTypeaheadMenuPlugin, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { INSERT_FILE_COMMAND, PopoverClassNames } from '@standardnotes/blocks-editor'
import { TextNode } from 'lexical'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { ItemSelectionItemComponent } from './ItemSelectionItemComponent'
import { ItemOption } from './ItemOption'
import { useApplication } from '@/Components/ApplicationView/ApplicationProvider'
import { ContentType, FileItem, SNNote } from '@standardnotes/snjs'
import { getLinkingSearchResults } from '@/Utils/Items/Search/getSearchResults'
import Popover from '@/Components/Popover/Popover'

type Props = {
  currentNote: SNNote
}

export const ItemSelectionPlugin: FunctionComponent<Props> = ({ currentNote }) => {
  const application = useApplication()

  const [editor] = useLexicalComposerContext()

  const [queryString, setQueryString] = useState<string | null>('')

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('@', {
    minLength: 0,
  })

  const [popoverOpen, setPopoverOpen] = useState(true)

  const onSelectOption = useCallback(
    (selectedOption: ItemOption, nodeToRemove: TextNode | null, closeMenu: () => void, matchingString: string) => {
      editor.update(() => {
        if (nodeToRemove) {
          nodeToRemove.remove()
        }
        selectedOption.options.onSelect(matchingString)
        setPopoverOpen(false)
        closeMenu()
      })
    },
    [editor],
  )

  const options = useMemo(() => {
    const results = getLinkingSearchResults(queryString || '', application, currentNote, {
      contentType: ContentType.File,
      returnEmptyIfQueryEmpty: false,
    })
    const files = [...results.linkedItems, ...results.unlinkedItems] as FileItem[]
    return files.map((file) => {
      return new ItemOption(file, {
        onSelect: (_queryString: string) => {
          editor.dispatchCommand(INSERT_FILE_COMMAND, file.uuid)
        },
      })
    })
  }, [application, editor, currentNote, queryString])

  return (
    <LexicalTypeaheadMenuPlugin<ItemOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      onClose={() => {
        setPopoverOpen(false)
      }}
      onOpen={() => {
        setPopoverOpen(true)
      }}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
        if (!anchorElementRef.current || !options.length) {
          return null
        }

        return (
          <Popover
            align="start"
            anchorPoint={{
              x: anchorElementRef.current.offsetLeft,
              y: anchorElementRef.current.offsetTop + anchorElementRef.current.offsetHeight,
            }}
            className={'min-h-80 h-80'}
            open={popoverOpen}
            togglePopover={() => {
              setPopoverOpen((prevValue) => !prevValue)
            }}
          >
            <div className={PopoverClassNames}>
              <ul>
                {options.map((option, i: number) => (
                  <ItemSelectionItemComponent
                    searchQuery={queryString || ''}
                    index={i}
                    isSelected={selectedIndex === i}
                    onClick={() => {
                      setHighlightedIndex(i)
                      selectOptionAndCleanUp(option)
                    }}
                    onMouseEnter={() => {
                      setHighlightedIndex(i)
                    }}
                    key={option.key}
                    option={option}
                  />
                ))}
              </ul>
            </div>
          </Popover>
        )
      }}
    />
  )
}
