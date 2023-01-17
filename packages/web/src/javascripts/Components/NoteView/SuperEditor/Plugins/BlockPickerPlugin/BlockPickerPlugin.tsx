import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalTypeaheadMenuPlugin, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { TextNode } from 'lexical'
import { useCallback, useMemo, useState } from 'react'
import useModal from '@standardnotes/blocks-editor/src/Lexical/Hooks/useModal'
import { InsertTableDialog } from '@standardnotes/blocks-editor/src/Lexical/Plugins/TablePlugin'
import { BlockPickerOption } from './BlockPickerOption'
import { BlockPickerMenuItem } from './BlockPickerMenuItem'
import { GetNumberedListBlock } from './Blocks/NumberedList'
import { GetBulletedListBlock } from './Blocks/BulletedList'
import { GetChecklistBlock } from './Blocks/Checklist'
import { GetDividerBlock } from './Blocks/Divider'
import { GetCollapsibleBlock } from './Blocks/Collapsible'
import { GetDynamicPasswordBlocks, GetPasswordBlocks } from './Blocks/Password'
import { GetParagraphBlock } from './Blocks/Paragraph'
import { GetHeadingsBlocks } from './Blocks/Headings'
import { GetQuoteBlock } from './Blocks/Quote'
import { GetAlignmentBlocks } from './Blocks/Alignment'
import { GetCodeBlock } from './Blocks/Code'
import { GetEmbedsBlocks } from './Blocks/Embeds'
import { GetDynamicTableBlocks, GetTableBlock } from './Blocks/Table'
import Popover from '@/Components/Popover/Popover'
import { PopoverClassNames } from '../ClassNames'
import { GetDatetimeBlocks } from './Blocks/DateTime'
import { isMobileScreen } from '@/Utils'
import { useApplication } from '@/Components/ApplicationProvider'
import { GetIndentOutdentBlocks } from './Blocks/IndentOutdent'

export default function BlockPickerMenuPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const application = useApplication()
  const [modal, showModal] = useModal()
  const [queryString, setQueryString] = useState<string | null>(null)

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  })

  const options = useMemo(() => {
    const indentOutdentOptions = application.isNativeMobileWeb() ? GetIndentOutdentBlocks(editor) : []

    const baseOptions = [
      GetParagraphBlock(editor),
      ...GetHeadingsBlocks(editor),
      ...indentOutdentOptions,
      GetTableBlock(() =>
        showModal('Insert Table', (onClose) => <InsertTableDialog activeEditor={editor} onClose={onClose} />),
      ),
      GetNumberedListBlock(editor),
      GetBulletedListBlock(editor),
      GetChecklistBlock(editor),
      GetQuoteBlock(editor),
      GetCodeBlock(editor),
      GetDividerBlock(editor),
      ...GetDatetimeBlocks(editor),
      ...GetAlignmentBlocks(editor),
      ...GetPasswordBlocks(editor),
      GetCollapsibleBlock(editor),
      ...GetEmbedsBlocks(editor),
    ]

    const dynamicOptions = [
      ...GetDynamicTableBlocks(editor, queryString || ''),
      ...GetDynamicPasswordBlocks(editor, queryString || ''),
    ]

    return queryString
      ? [
          ...dynamicOptions,
          ...baseOptions.filter((option) => {
            return new RegExp(queryString, 'gi').exec(option.title) || option.keywords != null
              ? option.keywords.some((keyword) => new RegExp(queryString, 'gi').exec(keyword))
              : false
          }),
        ]
      : baseOptions
  }, [editor, queryString, showModal, application])

  const onSelectOption = useCallback(
    (
      selectedOption: BlockPickerOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string,
    ) => {
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

  return (
    <>
      {modal}
      <LexicalTypeaheadMenuPlugin<BlockPickerOption>
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
              title="Block picker"
              align="start"
              anchorElement={anchorElementRef.current}
              open={true}
              disableMobileFullscreenTakeover={true}
              side={isMobileScreen() ? 'top' : 'bottom'}
              maxHeight={(mh) => mh / 2}
            >
              <div className={PopoverClassNames}>
                <ul>
                  {options.map((option, i: number) => (
                    <BlockPickerMenuItem
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
    </>
  )
}
