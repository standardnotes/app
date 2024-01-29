import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { HashtagNode } from '@lexical/hashtag'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { MarkNode } from '@lexical/mark'
import { OverflowNode } from '@lexical/overflow'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { TweetNode } from './TweetNode'
import { YouTubeNode } from './YouTubeNode'
import { CollapsibleContainerNode } from '../../Plugins/CollapsiblePlugin/CollapsibleContainerNode'
import { CollapsibleContentNode } from '../../Plugins/CollapsiblePlugin/CollapsibleContentNode'
import { CollapsibleTitleNode } from '../../Plugins/CollapsiblePlugin/CollapsibleTitleNode'
import { FileNode } from '../../Plugins/EncryptedFilePlugin/Nodes/FileNode'
import { BubbleNode } from '../../Plugins/ItemBubblePlugin/Nodes/BubbleNode'
import { RemoteImageNode } from '../../Plugins/RemoteImagePlugin/RemoteImageNode'
import { InlineFileNode } from '../../Plugins/InlineFilePlugin/InlineFileNode'
import { CreateEditorArgs } from 'lexical'
import { FileExportNode } from './FileExportNode'

const CommonNodes = [
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
  MarkNode,
  OverflowNode,
  QuoteNode,
  TableCellNode,
  TableNode,
  TableRowNode,
  TweetNode,
  YouTubeNode,
  FileNode,
  BubbleNode,
  RemoteImageNode,
  InlineFileNode,
  ListNode,
]

export const BlockEditorNodes = CommonNodes

export const SuperExportNodes: CreateEditorArgs['nodes'] = [...CommonNodes, FileExportNode]
