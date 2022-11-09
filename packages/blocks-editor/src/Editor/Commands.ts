import {createCommand, LexicalCommand} from 'lexical';

export const INSERT_FILE_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_FILE_COMMAND',
);
