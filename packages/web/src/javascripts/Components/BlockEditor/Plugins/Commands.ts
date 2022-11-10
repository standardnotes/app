import { createCommand, LexicalCommand } from 'lexical'

export const INSERT_FILE_COMMAND: LexicalCommand<string> = createCommand('INSERT_FILE_COMMAND')
export const INSERT_BUBBLE_COMMAND: LexicalCommand<string> = createCommand('INSERT_BUBBLE_COMMAND')
