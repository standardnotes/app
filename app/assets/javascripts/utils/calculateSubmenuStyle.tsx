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

    if (buttonRect.right + maxChangeEditorMenuSize > clientWidth) {
      position = {
        bottom: positionBottom,
        right: clientWidth - buttonRect.left,
        visibility: 'hidden',
        maxHeight: 'auto',
      };
    } else {
      position = {
        bottom: positionBottom,
        left: buttonRect.right,
        visibility: 'hidden',
        maxHeight: 'auto',
      };
    }
  }

  if (menuBoundingRect && menuBoundingRect.height && buttonRect) {
    if (
      menuBoundingRect.y < MENU_MARGIN_FROM_APP_BORDER ||
      menuBoundingRect.height > clientHeight / 2
    ) {
      position = {
        ...position,
        top: MENU_MARGIN_FROM_APP_BORDER,
        bottom: 'auto',
        visibility: 'visible',
      };
    } else {
      position = {
        ...position,
        top: MENU_MARGIN_FROM_APP_BORDER + buttonRect.top - buttonRect.height,
        bottom: 'auto',
        visibility: 'visible',
      };
    }
  }

  if (position.top && position.top !== 'auto') {
    position.maxHeight =
      clientHeight -
      position.top -
      footerHeightInPx -
      MENU_MARGIN_FROM_APP_BORDER;
  }

  return position;
};
