import {
  InsertHr,
  InsertImage,
  LiftListItem,
  SinkListItem,
  WrapInBlockquote,
  WrapInBulletList,
  WrapInOrderedList,
} from '@milkdown/preset-commonmark'
import { InsertTable, TurnIntoTaskList } from '@milkdown/preset-gfm'
import { EditorView, liftListItem, sinkListItem, wrapIn } from '@milkdown/prose'
import { ButtonConfig } from './button'
import { SelectConfig } from './select'

export type MenuCommonConfig = {
  disabled?: (view: EditorView) => boolean
}

export type MenuConfigItem = SelectConfig | ButtonConfig
export type MenuConfig = Array<Array<MenuConfigItem>>

export const menuConfig: any = [
  [
    {
      type: 'button',
      icon: 'bulletList',
      key: WrapInBulletList,
      disabled: (view: EditorView) => {
        const { state } = view
        return !wrapIn(state.schema.nodes.bullet_list)(state)
      },
    },
    {
      type: 'button',
      icon: 'orderedList',
      key: WrapInOrderedList,
      disabled: (view: EditorView) => {
        const { state } = view
        return !wrapIn(state.schema.nodes.ordered_list)(state)
      },
    },
    {
      type: 'button',
      icon: 'taskList',
      key: TurnIntoTaskList,
      disabled: (view: EditorView) => {
        const { state } = view
        return !wrapIn(state.schema.nodes.task_list_item)(state)
      },
    },
    {
      type: 'button',
      icon: 'liftList',
      key: LiftListItem,
      disabled: (view: EditorView) => {
        const { state } = view
        return !liftListItem(state.schema.nodes.list_item)(state)
      },
    },
    {
      type: 'button',
      icon: 'sinkList',
      key: SinkListItem,
      disabled: (view: EditorView) => {
        const { state } = view
        return !sinkListItem(state.schema.nodes.list_item)(state)
      },
    },
  ],
  [
    {
      type: 'button',
      icon: 'image',
      key: InsertImage,
    },
    {
      type: 'button',
      icon: 'table',
      key: InsertTable,
    },
  ],
  [
    {
      type: 'button',
      icon: 'quote',
      key: WrapInBlockquote,
    },
    {
      type: 'button',
      icon: 'divider',
      key: InsertHr,
    },
  ],
]
