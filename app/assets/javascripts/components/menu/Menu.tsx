import {
  JSX,
  FunctionComponent,
  ComponentChildren,
  VNode,
  RefCallback,
  ComponentChild,
} from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { MenuItem, MenuItemListElement } from './MenuItem';
import { KeyboardKey } from '@/services/ioService';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const menuElementRef = useRef<HTMLMenuElement>(null);

  const handleKeyDown: JSXInternal.KeyboardEventHandler<HTMLMenuElement> = (
    event
  ) => {
    if (!menuItemRefs.current) {
      return;
    }

    switch (event.key) {
      case KeyboardKey.Home:
        setCurrentIndex(0);
        break;
      case KeyboardKey.End:
        setCurrentIndex(
          menuItemRefs.current.length ? menuItemRefs.current.length - 1 : 0
        );
        break;
      case KeyboardKey.Down:
        setCurrentIndex((index) => {
          if (index + 1 < menuItemRefs.current.length) {
            return index + 1;
          } else {
            return 0;
          }
        });
        break;
      case KeyboardKey.Up:
        setCurrentIndex((index) => {
          if (index - 1 > -1) {
            return index - 1;
          } else {
            return menuItemRefs.current.length - 1;
          }
        });
        break;
      case KeyboardKey.Escape:
        closeMenu?.();
        break;
    }
  };

  useEffect(() => {
    if (isOpen && menuItemRefs.current[currentIndex]) {
      menuItemRefs.current[currentIndex]?.focus();
    }
  }, [currentIndex, isOpen]);

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
  ) => {
    if (!child) return;

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
      className={`m-0 p-0 list-style-none ${className}`}
      onKeyDown={handleKeyDown}
      ref={menuElementRef}
      style={style}
      aria-label={a11yLabel}
    >
      {Array.isArray(children) ? children.map(mapMenuItems) : null}
    </menu>
  );
};
