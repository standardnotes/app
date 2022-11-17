import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {HashtagNode} from '@lexical/hashtag';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {ListItemNode, ListNode} from '@lexical/list';
import {MarkNode} from '@lexical/mark';
import {OverflowNode} from '@lexical/overflow';
import {HorizontalRuleNode} from '@lexical/react/LexicalHorizontalRuleNode';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {TableCellNode, TableNode, TableRowNode} from '@lexical/table';
import {TweetNode} from './TweetNode';
import {YouTubeNode} from './YouTubeNode';
import {CollapsibleContainerNode} from '../Plugins/CollapsiblePlugin/CollapsibleContainerNode';
import {CollapsibleContentNode} from '../Plugins/CollapsiblePlugin/CollapsibleContentNode';
import {CollapsibleTitleNode} from '../Plugins/CollapsiblePlugin/CollapsibleTitleNode';

export const BlockEditorNodes = [
  AutoLinkNode,
  CodeHighlightNode,
  CodeNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  HashtagNode,
  HeadingNode,
  HorizontalRuleNode,
  LinkNode,
  ListItemNode,
  ListNode,
  MarkNode,
  OverflowNode,
  QuoteNode,
  TableCellNode,
  TableNode,
  TableRowNode,
  TweetNode,
  YouTubeNode,
];
