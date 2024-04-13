import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalTypeaheadMenuPlugin, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { TextNode } from 'lexical'
import { useCallback, useMemo, useState } from 'react'
import useModal from '../../Lexical/Hooks/useModal'
import { InsertTableDialog } from '../../Plugins/TablePlugin'
import { BlockPickerOption } from './BlockPickerOption'
import { BlockPickerMenuItem } from './BlockPickerMenuItem'
import { GetDynamicPasswordBlocks, GetPasswordBlockOption } from '../Blocks/Password'
import { GetDynamicTableBlocks, GetTableBlockOption } from '../Blocks/Table'
import Popover from '@/Components/Popover/Popover'
import { GetDatetimeBlockOptions } from '../Blocks/DateTime'
import { isMobileScreen } from '@/Utils'
import { useApplication } from '@/Components/ApplicationProvider'
import { GetRemoteImageBlockOption } from '../Blocks/RemoteImage'
import { InsertRemoteImageDialog } from '../RemoteImagePlugin/RemoteImagePlugin'
import { GetParagraphBlockOption } from '../Blocks/Paragraph'
import { GetH1BlockOption, GetH2BlockOption, GetH3BlockOption } from '../Blocks/Headings'
import { GetIndentBlockOption, GetOutdentBlockOption } from '../Blocks/IndentOutdent'
import {
  GetCenterAlignBlockOption,
  GetJustifyAlignBlockOption,
  GetLeftAlignBlockOption,
  GetRightAlignBlockOption,
} from '../Blocks/Alignment'
import { GetNumberedListBlockOption, GetBulletedListBlockOption, GetChecklistBlockOption } from '../Blocks/List'
import { GetCodeBlockOption } from '../Blocks/Code'
import { GetQuoteBlockOption } from '../Blocks/Quote'
import { GetDividerBlockOption } from '../Blocks/Divider'
import { GetCollapsibleBlockOption } from '../Blocks/Collapsible'
import { GetEmbedsBlockOptions } from '../Blocks/Embeds'
import { GetUploadFileOption } from '../Blocks/File'

export default function BlockPickerMenuPlugin({ popoverZIndex }: { popoverZIndex?: string }): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const application = useApplication()
  const [modal, showModal] = useModal()
  const [queryString, setQueryString] = useState<string | null>(null)

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  })

  const options = useMemo(() => {
    const indentOutdentOptions = application.isNativeMobileWeb()
      ? [GetIndentBlockOption(editor), GetOutdentBlockOption(editor)]
      : []

    const baseOptions = [
      GetParagraphBlockOption(editor),
      GetH1BlockOption(editor),
      GetH2BlockOption(editor),
      GetH3BlockOption(editor),
      ...indentOutdentOptions,
      GetTableBlockOption(() =>
        showModal('Insert Table', (onClose) => <InsertTableDialog activeEditor={editor} onClose={onClose} />),
      ),
      GetRemoteImageBlockOption(() => {
        showModal('Insert image from URL', (onClose) => <InsertRemoteImageDialog onClose={onClose} />)
      }),
      GetUploadFileOption(editor),
      GetNumberedListBlockOption(editor),
      GetBulletedListBlockOption(editor),
      GetChecklistBlockOption(editor),
      GetQuoteBlockOption(editor),
      GetCodeBlockOption(editor),
      GetDividerBlockOption(editor),
      ...GetDatetimeBlockOptions(editor),
      GetLeftAlignBlockOption(editor),
      GetCenterAlignBlockOption(editor),
      GetRightAlignBlockOption(editor),
      GetJustifyAlignBlockOption(editor),
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
              overrideZIndex={popoverZIndex}
            >
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
            </Popover>
          )
        }}
      />
    </>
  )
}
