import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalTypeaheadMenuPlugin, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { TextNode } from 'lexical'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { ItemSelectionItemComponent } from './ItemSelectionItemComponent'
import { ItemOption } from './ItemOption'
import { useApplication } from '@/Components/ApplicationView/ApplicationProvider'
import { ContentType, SNNote } from '@standardnotes/snjs'
import { getLinkingSearchResults } from '@/Utils/Items/Search/getSearchResults'
import Popover from '@/Components/Popover/Popover'
import { INSERT_BUBBLE_COMMAND, INSERT_FILE_COMMAND } from '../Commands'
import { useLinkingController } from '../../../../../Controllers/LinkingControllerProvider'
import { PopoverClassNames } from '../ClassNames'
import { isMobileScreen } from '@/Utils'

type Props = {
  currentNote: SNNote
}

export const ItemSelectionPlugin: FunctionComponent<Props> = ({ currentNote }) => {
  const application = useApplication()

  const [editor] = useLexicalComposerContext()

  const linkingController = useLinkingController()

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
          if (item.content_type === ContentType.File) {
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
            anchorElement={anchorElementRef.current}
            open={popoverOpen}
            togglePopover={() => {
              setPopoverOpen((prevValue) => !prevValue)
            }}
            disableMobileFullscreenTakeover={true}
            side={isMobileScreen() ? 'top' : 'bottom'}
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
