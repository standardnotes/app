/* Copyright 2021, Milkdown by Mirone. */

import { css } from '@emotion/css'
import { Utils } from '@milkdown/utils'

export type DividerConfig = {
  type: 'divider'
  group: HTMLElement[]
}

export const divider = (utils: Utils, config: DividerConfig) => {
  const dividerStyle = utils.getStyle((themeTool) => {
    return css`
      flex-shrink: 0;
      width: ${themeTool.size.lineWidth};
      background-color: ${themeTool.palette('line')};
      margin: 0.75rem 1rem;
    `
  })

  const $divider = document.createElement('div')
  $divider.classList.add('divider')

  if (dividerStyle) {
    $divider.classList.add(dividerStyle)
  }

  const disabled = config.group.every(
    (x) => x.getAttribute('disabled') || x.classList.contains('disabled')
  )

  if (disabled) {
    $divider.classList.add('disabled')
  } else {
    $divider.classList.remove('disabled')
  }

  return $divider
}
