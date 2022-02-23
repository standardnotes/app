import {
  MAX_MENU_SIZE_MULTIPLIER,
  MENU_MARGIN_FROM_APP_BORDER,
} from '@/constants';

export type SubmenuStyle = {
  top?: number | 'auto';
  right?: number | 'auto';
  bottom: number | 'auto';
  left?: number | 'auto';
  visibility?: 'hidden' | 'visible';
  maxHeight: number | 'auto';
};

export const calculateSubmenuStyle = (
  button: HTMLButtonElement | null,
  menu?: HTMLDivElement | null
): SubmenuStyle | undefined => {
  const defaultFontSize = window.getComputedStyle(
    document.documentElement
  ).fontSize;
  const maxChangeEditorMenuSize =
    parseFloat(defaultFontSize) * MAX_MENU_SIZE_MULTIPLIER;
  const { clientWidth, clientHeight } = document.documentElement;
  const buttonRect = button?.getBoundingClientRect();
  const buttonParentRect = button?.parentElement?.getBoundingClientRect();
  const menuBoundingRect = menu?.getBoundingClientRect();
  const footerElementRect = document
    .getElementById('footer-bar')
    ?.getBoundingClientRect();
  const footerHeightInPx = footerElementRect?.height ?? 0;

  let position: SubmenuStyle = {
    bottom: 'auto',
    maxHeight: 'auto',
  };

  if (buttonRect && buttonParentRect) {
    let positionBottom =
      clientHeight - buttonRect.bottom - buttonRect.height / 2;

    if (positionBottom < footerHeightInPx) {
      positionBottom = footerHeightInPx + MENU_MARGIN_FROM_APP_BORDER;
    }

    position = {
      bottom: positionBottom,
      visibility: 'hidden',
      maxHeight: 'auto',
    };

    if (buttonRect.right + maxChangeEditorMenuSize > clientWidth) {
      position.right = clientWidth - buttonRect.left;
    } else {
      position.left = buttonRect.right;
    }
  }

  if (menuBoundingRect?.height && buttonRect && position.bottom !== 'auto') {
    position.visibility = 'visible';

    if (menuBoundingRect.y < MENU_MARGIN_FROM_APP_BORDER) {
      position.bottom =
        position.bottom + menuBoundingRect.y - MENU_MARGIN_FROM_APP_BORDER * 2;
    }

    if (footerElementRect && menuBoundingRect.height > footerElementRect.y) {
      position.bottom = footerElementRect.height + MENU_MARGIN_FROM_APP_BORDER;
      position.maxHeight =
        clientHeight -
        footerElementRect.height -
        MENU_MARGIN_FROM_APP_BORDER * 2;
    }
  }

  return position;
};
