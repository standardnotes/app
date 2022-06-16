import { defaultValueCtx, Editor, editorViewOptionsCtx, rootCtx } from '@milkdown/core'
import { clipboard } from '@milkdown/plugin-clipboard'
import { cursor } from '@milkdown/plugin-cursor'
import { diagram } from '@milkdown/plugin-diagram'
import { history } from '@milkdown/plugin-history'
import { indent } from '@milkdown/plugin-indent'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { math } from '@milkdown/plugin-math'
import { prism } from '@milkdown/plugin-prism'
import { slash } from '@milkdown/plugin-slash'
import { tooltip } from '@milkdown/plugin-tooltip'
import { gfm } from '@milkdown/preset-gfm'
import { nord } from '@milkdown/theme-nord'

import { menu } from './plugins/advanced-menu'
import { MenuConfig } from './plugins/advanced-menu/config'

export type CreateEditorParams = {
  root: HTMLElement | null
  onChange: (text: string) => void
  value?: string
  menuConfig: MenuConfig
  editable: boolean
  spellcheck: boolean
}

export const createEditor = ({ root, onChange, value, menuConfig, editable, spellcheck }: CreateEditorParams) => {
  const editor = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root)
      value && ctx.set(defaultValueCtx, value)

      ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
        onChange(markdown)
      })

      ctx.set(editorViewOptionsCtx, {
        editable: () => editable,
      })

      root?.setAttribute('spellcheck', JSON.stringify(spellcheck))
    })
    .use(nord)
    .use(clipboard)
    .use(gfm)
    .use(listener)
    .use(math)
    .use(indent)
    .use(prism)
    .use(slash)
    .use(tooltip)
    .use(diagram)
    .use(cursor)
    .use(history)
    .use(
      menu({
        config: menuConfig,
      }),
    )

  return editor
}
