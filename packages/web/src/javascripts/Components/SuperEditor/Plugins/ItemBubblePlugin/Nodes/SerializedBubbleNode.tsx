import { Spread, SerializedLexicalNode } from 'lexical'

export type SerializedBubbleNode = Spread<
  {
    itemUuid: string
  },
  SerializedLexicalNode
>
