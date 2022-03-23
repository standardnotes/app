import {
  JSX,
  FunctionComponent,
  ComponentChildren,
  VNode,
  RefCallback,
  ComponentChild,
} from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { MenuItem, MenuItemListElement } from './MenuItem';
import { KeyboardKey } from '@/services/ioService';
import { useListKeyboardNavigation } from '../utils';

type MenuProps = {
  className?: string;
  style?: string | JSX.CSSProperties | undefined;
  a11yLabel: string;
  children: ComponentChildren;
  closeMenu?: () => void;
  isOpen: boolean;
};

export const Menu: FunctionComponent<MenuProps> = ({
  children,
  className = '',
  style,
  a11yLabel,
  closeMenu,
  isOpen,
}: MenuProps) => {
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const menuElementRef = useRef<HTMLMenuElement>(null);

  const handleKeyDown: JSXInternal.KeyboardEventHandler<HTMLMenuElement> = (
    event
  ) => {
    if (!menuItemRefs.current) {
      return;
    }

    if (event.key === KeyboardKey.Escape) {
      closeMenu?.();
      return;
    }
  };

  useListKeyboardNavigation(menuElementRef);

  useEffect(() => {
    if (isOpen && menuItemRefs.current.length > 0) {
      setTimeout(() => {
        menuElementRef.current?.focus();
      });
    }
  }, [isOpen]);

  const pushRefToArray: RefCallback<HTMLLIElement> = (instance) => {
    if (instance && instance.children) {
      Array.from(instance.children).forEach((child) => {
        if (
          child.getAttribute('role')?.includes('menuitem') &&
          !menuItemRefs.current.includes(child as HTMLButtonElement)
        ) {
          menuItemRefs.current.push(child as HTMLButtonElement);
        }
      });
    }
  };

  const mapMenuItems = (
    child: ComponentChild,
    index: number,
    array: ComponentChild[]
  ): ComponentChild => {
    if (!child || (Array.isArray(child) && child.length < 1)) return;

    if (Array.isArray(child)) {
      return child.map(mapMenuItems);
    }

    const _child = child as VNode<unknown>;
    const isFirstMenuItem =
      index ===
      array.findIndex((child) => (child as VNode<unknown>).type === MenuItem);

    const hasMultipleItems = Array.isArray(_child.props.children)
      ? Array.from(_child.props.children as ComponentChild[]).some(
          (child) => (child as VNode<unknown>).type === MenuItem
        )
      : false;

    const items = hasMultipleItems
      ? [...(_child.props.children as ComponentChild[])]
      : [_child];

    return items.map((child) => {
      return (
        <MenuItemListElement
          isFirstMenuItem={isFirstMenuItem}
          ref={pushRefToArray}
        >
          {child}
        </MenuItemListElement>
      );
    });
  };

  return (
    <menu
      className={`m-0 p-0 list-style-none focus:shadow-none ${className}`}
      onKeyDown={handleKeyDown}
      ref={menuElementRef}
      style={style}
      aria-label={a11yLabel}
    >
      {Array.isArray(children) ? children.map(mapMenuItems) : null}
    </menu>
  );
};
