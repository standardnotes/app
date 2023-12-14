import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalTypeaheadMenuPlugin } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { TextNode } from 'lexical'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { ItemSelectionItemComponent } from './ItemSelectionItemComponent'
import { ItemOption } from './ItemOption'
import { useApplication } from '@/Components/ApplicationProvider'
import { ContentType, SNNote } from '@standardnotes/snjs'
import { getLinkingSearchResults } from '@/Utils/Items/Search/getSearchResults'
import { INSERT_BUBBLE_COMMAND, INSERT_FILE_COMMAND } from '../Commands'
import { useLinkingController } from '../../../../Controllers/LinkingControllerProvider'
import { useTypeaheadAllowingSpacesAndPunctuation } from './useTypeaheadAllowingSpacesAndPunctuation'
import { Popover, PopoverProvider } from '@ariakit/react'
import { PopoverClassNames } from '../ClassNames'

type Props = {
  currentNote: SNNote
}

export const ItemSelectionPlugin: FunctionComponent<Props> = ({ currentNote }) => {
  const application = useApplication()

  const [editor] = useLexicalComposerContext()

  const linkingController = useLinkingController()

  const [queryString, setQueryString] = useState<string | null>('')

  const checkForTriggerMatch = useTypeaheadAllowingSpacesAndPunctuation('@', {
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
    const { linkedItems, unlinkedItems, shouldShowCreateTag } = getLinkingSearchResults(
      queryString || '',
      application,
      currentNote,
      {
        returnEmptyIfQueryEmpty: false,
      },
    )

    const items = [...linkedItems, ...unlinkedItems]

    const options = items.map((item) => {
      return new ItemOption(item, item.title || '', {
        onSelect: (_queryString: string) => {
          void linkingController.linkItems(currentNote, item)
          if (item.content_type === ContentType.TYPES.File) {
            editor.dispatchCommand(INSERT_FILE_COMMAND, item.uuid)
          } else {
            editor.dispatchCommand(INSERT_BUBBLE_COMMAND, item.uuid)
          }
        },
      })
    })

    if (shouldShowCreateTag) {
      options.push(
        new ItemOption(undefined, '', {
          onSelect: async (queryString: string) => {
            const newTag = await linkingController.createAndAddNewTag(queryString || '')
            editor.dispatchCommand(INSERT_BUBBLE_COMMAND, newTag.uuid)
          },
        }),
      )
    }

    return options
  }, [application, editor, currentNote, queryString, linkingController])

  return (
    <PopoverProvider>
      <LexicalTypeaheadMenuPlugin<ItemOption>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
        options={options}
        menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
          if (!anchorElementRef.current || !options.length) {
            return null
          }
          return (
            <Popover
              open
              getAnchorRect={() => anchorElementRef.current!.getBoundingClientRect()}
              autoFocus={false}
              autoFocusOnShow={false}
              className={PopoverClassNames}
              fitViewport
            >
              <ul className="divide-y divide-border">
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
            </Popover>
          )
        }}
      />
    </PopoverProvider>
  )
}
