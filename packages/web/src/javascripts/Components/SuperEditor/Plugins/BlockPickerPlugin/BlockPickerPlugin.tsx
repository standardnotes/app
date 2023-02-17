import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalTypeaheadMenuPlugin, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { TextNode } from 'lexical'
import { useCallback, useMemo, useState } from 'react'
import useModal from '../../Lexical/Hooks/useModal'
import { InsertTableDialog } from '../../Plugins/TablePlugin'
import { BlockPickerOption } from './BlockPickerOption'
import { BlockPickerMenuItem } from './BlockPickerMenuItem'
import { GetNumberedListBlockOption } from './Options/NumberedList'
import { GetBulletedListBlockOption } from './Options/BulletedList'
import { GetChecklistBlockOption } from './Options/Checklist'
import { GetDividerBlockOption } from './Options/Divider'
import { GetCollapsibleBlockOption } from './Options/Collapsible'
import { GetDynamicPasswordBlocks, GetPasswordBlockOption } from './Options/Password'
import { GetParagraphBlockOption } from './Options/Paragraph'
import { GetHeadingsBlockOptions } from './Options/Headings'
import { GetQuoteBlockOption } from './Options/Quote'
import { GetAlignmentBlockOptions } from './Options/Alignment'
import { GetCodeBlockOption } from './Options/Code'
import { GetEmbedsBlockOptions } from './Options/Embeds'
import { GetDynamicTableBlocks, GetTableBlockOption } from './Options/Table'
import Popover from '@/Components/Popover/Popover'
import { PopoverClassNames } from '../ClassNames'
import { GetDatetimeBlockOptions } from './Options/DateTime'
import { isMobileScreen } from '@/Utils'
import { useApplication } from '@/Components/ApplicationProvider'
import { GetIndentOutdentBlockOptions } from './Options/IndentOutdent'

export default function BlockPickerMenuPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const application = useApplication()
  const [modal, showModal] = useModal()
  const [queryString, setQueryString] = useState<string | null>(null)

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  })

  const options = useMemo(() => {
    const indentOutdentOptions = application.isNativeMobileWeb() ? GetIndentOutdentBlockOptions(editor) : []

    const baseOptions = [
      GetParagraphBlockOption(editor),
      ...GetHeadingsBlockOptions(editor),
      ...indentOutdentOptions,
      GetTableBlockOption(() =>
        showModal('Insert Table', (onClose) => <InsertTableDialog activeEditor={editor} onClose={onClose} />),
      ),
      GetNumberedListBlockOption(editor),
      GetBulletedListBlockOption(editor),
      GetChecklistBlockOption(editor),
      GetQuoteBlockOption(editor),
      GetCodeBlockOption(editor),
      GetDividerBlockOption(editor),
      ...GetDatetimeBlockOptions(editor),
      ...GetAlignmentBlockOptions(editor),
      GetPasswordBlockOption(editor),
      GetCollapsibleBlockOption(editor),
      ...GetEmbedsBlockOptions(editor),
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
