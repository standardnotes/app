import { Spread, SerializedLexicalNode } from 'lexical'

export type SerializedBubbleNode = Spread<
  {
    itemUuid: string
    version: 1
    type: 'snbubble'
  },
  SerializedLexicalNode
>
