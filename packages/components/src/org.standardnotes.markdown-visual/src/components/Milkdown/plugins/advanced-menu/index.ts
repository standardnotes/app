/* Copyright 2021, Milkdown by Mirone. */

import { createCmd, createCmdKey, Ctx } from '@milkdown/core'
import { EditorView, Plugin, PluginKey, selectParentNode } from '@milkdown/prose'
import { createPlugin } from '@milkdown/utils'

import { MenuConfig, menuConfig } from './config'
import { Manager } from './manager'
import { HandleDOM, MenuBar } from './menuBar'

export type Options = {
  config: MenuConfig
  domHandler: HandleDOM
}

export { menuConfig } from './config'

export const menu = createPlugin<string, Options>((utils, options) => {
  const config = options?.config ?? menuConfig
  const domHandler = options?.domHandler

  let restoreDOM: (() => void) | null = null
  let menu: HTMLDivElement | null = null
  let manager: Manager | null = null

  const SelectParent = createCmdKey()

  const initIfNecessary = (ctx: Ctx, editorView: EditorView) => {
    if (!menu) {
      const [_menu, _restoreDOM] = MenuBar(utils, editorView, ctx, domHandler)
      menu = _menu
      restoreDOM = () => {
        _restoreDOM()
        menu = null
        manager = null
      }
    }

    if (!manager) {
      manager = new Manager(config, utils, ctx, menu, editorView)
    }
  }

  return {
    commands: () => [createCmd(SelectParent, () => selectParentNode)],
    prosePlugins: (_, ctx) => {
      const plugin = new Plugin({
        key: new PluginKey('milkdown-advanced-menu'),
        view: (editorView) => {
          initIfNecessary(ctx, editorView)
          if (editorView.editable) {
            manager?.update(editorView)
          }
          return {
            update: (view) => manager?.update(view),
            destroy: () => restoreDOM?.(),
          }
        },
      })

      return [plugin]
    },
  }
})
