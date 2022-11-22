import { createCommand, LexicalCommand } from 'lexical'

export const INSERT_FILE_COMMAND: LexicalCommand<string> = createCommand('INSERT_FILE_COMMAND')
export const INSERT_BUBBLE_COMMAND: LexicalCommand<string> = createCommand('INSERT_BUBBLE_COMMAND')
export const INSERT_TIME_COMMAND: LexicalCommand<string> = createCommand('INSERT_TIME_COMMAND')
export const INSERT_DATE_COMMAND: LexicalCommand<string> = createCommand('INSERT_DATE_COMMAND')
export const INSERT_DATETIME_COMMAND: LexicalCommand<string> = createCommand('INSERT_DATETIME_COMMAND')
export const INSERT_PASSWORD_COMMAND: LexicalCommand<string> = createCommand('INSERT_PASSWORD_COMMAND')
