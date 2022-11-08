import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalTypeaheadMenuPlugin, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { INSERT_FILE_COMMAND, PopoverClassNames } from '@standardnotes/blocks-editor'
import { TextNode } from 'lexical'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import * as ReactDOM from 'react-dom'
import { ItemSelectionItemComponent } from './ItemSelectionItemComponent'
import { ItemOption } from './ItemOption'
import { useApplication } from '@/Components/ApplicationView/ApplicationProvider'
import { ContentType, FileItem, SNNote } from '@standardnotes/snjs'
import { getLinkingSearchResults } from '@/Utils/Items/Search/getSearchResults'

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

  const onSelectOption = useCallback(
    (selectedOption: ItemOption, nodeToRemove: TextNode | null, closeMenu: () => void, matchingString: string) => {
      editor.update(() => {
        if (nodeToRemove) {
          nodeToRemove.remove()
        }
        selectedOption.options.onSelect(matchingString)
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
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
        return anchorElementRef.current && options.length
          ? ReactDOM.createPortal(
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
              </div>,
              anchorElementRef.current,
            )
          : null
      }}
    />
  )
}
