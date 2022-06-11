/* Copyright 2021, Milkdown by Mirone. */

import { css } from '@emotion/css'
import { Ctx, rootCtx } from '@milkdown/core'
import { EditorView } from '@milkdown/prose'
import { Utils } from '@milkdown/utils'

export const MenuBar = (utils: Utils, view: EditorView, ctx: Ctx, domHandler: HandleDOM = defaultDOMHandler) => {
  const menuWrapper = document.createElement('div')
  menuWrapper.classList.add('milkdown-menu-wrapper')
  const menu = document.createElement('div')
  menu.classList.add('milkdown-menu')

  const editorDOM = view.dom as HTMLDivElement

  const editorWrapperStyle = utils.getStyle((themeTool) => {
    return themeTool.mixin.scrollbar('y')
  })

  if (editorWrapperStyle) {
    editorDOM.classList.add(editorWrapperStyle)
  }

  const menuStyle = utils.getStyle((themeTool) => {
    const border = themeTool.mixin.border()
    const scrollbar = themeTool.mixin.scrollbar('x')
    const style = css`
      box-sizing: border-box;
      width: 100%;
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      ${border};
      ${scrollbar};
      background: ${themeTool.palette('surface')};
      -webkit-overflow-scrolling: auto;
      .disabled {
        display: none;
      }
    `
    return style
  })

  if (menuStyle) {
    menuStyle.split(' ').forEach((x) => menu.classList.add(x))
  }

  const root = ctx.get(rootCtx)

  const editorRoot = getRoot(root) as HTMLElement
  const milkdownDOM = editorDOM.parentElement

  if (!milkdownDOM) {
    throw new Error('No parent node found')
  }

  domHandler({
    menu,
    menuWrapper,
    editorDOM,
    editorRoot,
    milkdownDOM,
  })

  const restoreDOM = () => {
    restore({
      menu,
      menuWrapper,
      editorDOM,
      editorRoot,
      milkdownDOM,
    })
  }

  return [menu, restoreDOM] as const
}

export type HandleDOMParams = {
  menu: HTMLDivElement
  menuWrapper: HTMLDivElement
  editorRoot: HTMLElement
  milkdownDOM: HTMLElement
  editorDOM: HTMLDivElement
}

export type HandleDOM = (params: HandleDOMParams) => void

const restore: HandleDOM = ({ milkdownDOM, editorRoot, menu, menuWrapper }) => {
  editorRoot.appendChild(milkdownDOM)
  menuWrapper.remove()
  menu.remove()
}

const defaultDOMHandler: HandleDOM = ({ menu, menuWrapper, editorRoot, milkdownDOM }) => {
  menuWrapper.appendChild(menu)
  editorRoot.replaceChild(menuWrapper, milkdownDOM)
  menuWrapper.appendChild(milkdownDOM)
}

const getRoot = (root: string | Node | null | undefined) => {
  if (!root) return document.body
  if (typeof root === 'string') {
    const el = document.querySelector(root)
    if (el) return el
    return document.body
  }
  return root
}
