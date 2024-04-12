import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { OPEN_FILE_UPLOAD_MODAL_COMMAND } from '../EncryptedFilePlugin/FilePlugin'

export function GetUploadFileOption(editor: LexicalEditor) {
  return new BlockPickerOption('Upload file', {
    iconName: 'file' as LexicalIconName,
    keywords: ['image', 'upload', 'file'],
    onSelect: () => editor.dispatchCommand(OPEN_FILE_UPLOAD_MODAL_COMMAND, undefined),
  })
}
