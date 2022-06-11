/* Copyright 2021, Milkdown by Mirone. */

import { css } from '@emotion/css';
import { CmdKey, commandsCtx, Ctx } from '@milkdown/core';
import type { Icon } from '@milkdown/design-system';
import type { EditorView } from '@milkdown/prose';
import type { Utils } from '@milkdown/utils';

import type { MenuCommonConfig } from './config';

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

type Config<T = any> = {
  type: 'button';
  icon: Icon;
  key?: CmdKey<T>;
  callback?: () => void;
  options?: T;
  active?: (view?: EditorView) => boolean;
  alwaysVisible: boolean;
} & MenuCommonConfig;

export type ButtonConfig = RequireAtLeastOne<Config, 'key' | 'callback'>;

export const button = (
  utils: Utils,
  config: Config,
  ctx: Ctx,
  view: EditorView
) => {
  const buttonStyle = utils.getStyle((themeTool) => {
    return css`
      border: 0;
      box-sizing: unset;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0.25rem;
      margin: 0.5rem;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: ${themeTool.palette('surface')};
      color: ${themeTool.palette('solid')};
      transition: all 0.4s ease-in-out;
      cursor: pointer;
      &.active,
      &:hover {
        background-color: ${themeTool.palette('secondary', 0.12)};
        color: ${themeTool.palette('primary')};
      }
      &:disabled {
        display: none;
      }
    `;
  });

  const $button = document.createElement('button');
  $button.setAttribute('type', 'button');
  $button.classList.add('button');

  if (buttonStyle) {
    $button.classList.add(buttonStyle);
  }

  const $label = utils.themeTool.slots.label(config.icon);
  if ($label) {
    $button.setAttribute('aria-label', $label);
    $button.setAttribute('title', $label);
  }

  const $icon = utils.themeTool.slots.icon(config.icon);
  $button.appendChild($icon);
  $button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    config.callback && config.callback();
    config.key && ctx.get(commandsCtx).call(config.key, config.options);
  });

  if (config.active) {
    const active = config.active();
    if (active) {
      $button.classList.add('active');
    } else {
      $button.classList.remove('active');
    }
  }

  if (config.alwaysVisible) {
    $button.removeAttribute('disabled');
    return $button;
  }

  const disabled = !view.editable || (config.disabled && config.disabled(view));
  if (disabled) {
    $button.setAttribute('disabled', 'true');
  } else {
    $button.removeAttribute('disabled');
  }

  return $button;
};
