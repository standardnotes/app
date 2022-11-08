import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalTypeaheadMenuPlugin, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { INSERT_FILE_COMMAND } from '@standardnotes/blocks-editor'
import { TextNode } from 'lexical'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import * as ReactDOM from 'react-dom'
import { ItemSelectionItemComponent } from './ItemSelectionItemComponent'
import { ItemOption } from './ItemOption'
import { useApplication } from '@/Components/ApplicationView/ApplicationProvider'

export const ItemSelectionPlugin: FunctionComponent = () => {
  const application = useApplication()

  const [editor] = useLexicalComposerContext()

  const [_queryString, setQueryString] = useState<string | null>(null)

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('@', {
    minLength: 0,
  })

  const onSelectOption = useCallback(
    (selectedOption: ItemOption, nodeToRemove: TextNode | null, closeMenu: () => void, matchingString: string) => {
      editor.update(() => {
        if (nodeToRemove) {
          nodeToRemove.remove()
        }
        selectedOption.onSelect(matchingString)
        closeMenu()
      })
    },
    [editor],
  )

  const options = useMemo(() => {
    const files = application.items.getDisplayableFiles()
    return files.map((file) => {
      return new ItemOption(file.name, file.uuid, {
        onSelect: (_queryString: string) => {
          editor.dispatchCommand(INSERT_FILE_COMMAND, file.uuid)
        },
      })
    })
  }, [application, editor])

  return (
    <>
      <LexicalTypeaheadMenuPlugin<ItemOption>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
        options={options}
        menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
          return anchorElementRef.current && options.length
            ? ReactDOM.createPortal(
                <div className="typeahead-popover component-picker-menu">
                  <ul>
                    {options.map((option, i: number) => (
                      <ItemSelectionItemComponent
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
    </>
  )
}
