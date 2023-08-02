import * as icons from '@standardnotes/icons'

export const LexicalIconNameToSvgMapping = {
  'lexical-code': icons.LexicalCode,
  'align-center': icons.LexicalTextCenter,
  'align-justify': icons.LexicalTextJustify,
  'align-left': icons.LexicalTextLeft,
  'align-right': icons.LexicalTextRight,
  'horizontal-rule': icons.LexicalHorizontalRule,
  'list-ol': icons.LexicalListOL,
  'list-ul': icons.LexicalListUL,
  check: icons.LexicalCheck,
  quote: icons.LexicalQuote,
  table: icons.LexicalTable,
  tweet: icons.LexicalTweet,
  youtube: icons.LexicalYoutube,
  paragraph: icons.LexicalTextParagraph,
  h1: icons.TypeH1,
  h2: icons.TypeH2,
  h3: icons.TypeH3,
  h4: icons.TypeH4,
  h5: icons.TypeH5,
  h6: icons.TypeH6,
}

export type LexicalIconName = keyof typeof LexicalIconNameToSvgMapping
