import { FORMAT_ELEMENT_COMMAND, LexicalEditor } from 'lexical'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'

export const LeftAlignBlock = {
  name: 'Align left',
  iconName: 'align-left',
  keywords: ['align', 'justify', 'left'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'),
}

export const CenterAlignBlock = {
  name: 'Align center',
  iconName: 'align-center',
  keywords: ['align', 'justify', 'center'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'),
}

export const RightAlignBlock = {
  name: 'Align right',
  iconName: 'align-right',
  keywords: ['align', 'justify', 'right'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'),
}

export const JustifyAlignBlock = {
  name: 'Align justify',
  iconName: 'align-justify',
  keywords: ['align', 'justify', 'justify'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'),
}

export function GetLeftAlignBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(LeftAlignBlock.name, {
    iconName: LeftAlignBlock.iconName as LexicalIconName,
    keywords: LeftAlignBlock.keywords,
    onSelect: () => LeftAlignBlock.onSelect(editor),
  })
}

export function GetCenterAlignBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(CenterAlignBlock.name, {
    iconName: CenterAlignBlock.iconName as LexicalIconName,
    keywords: CenterAlignBlock.keywords,
    onSelect: () => CenterAlignBlock.onSelect(editor),
  })
}

export function GetRightAlignBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(RightAlignBlock.name, {
    iconName: RightAlignBlock.iconName as LexicalIconName,
    keywords: RightAlignBlock.keywords,
    onSelect: () => RightAlignBlock.onSelect(editor),
  })
}

export function GetJustifyAlignBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(JustifyAlignBlock.name, {
    iconName: JustifyAlignBlock.iconName as LexicalIconName,
    keywords: JustifyAlignBlock.keywords,
    onSelect: () => JustifyAlignBlock.onSelect(editor),
  })
}
