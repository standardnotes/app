import {
  JSX,
  FunctionComponent,
  Ref,
  ComponentChildren,
  VNode,
  RefCallback,
  ComponentChild,
} from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { forwardRef } from 'preact/compat';
import { MenuItem, MenuItemListElement } from './MenuItem';

type MenuProps = {
  className?: string;
  style?: string | JSX.CSSProperties | undefined;
  a11yLabel: string;
  children: ComponentChildren;
  closeMenu: () => void;
};

export const Menu: FunctionComponent<MenuProps> = forwardRef(
  (
    { children, className = '', style, a11yLabel, closeMenu }: MenuProps,
    ref: Ref<HTMLMenuElement>
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown: JSXInternal.KeyboardEventHandler<HTMLMenuElement> = (
      event
    ) => {
      switch (event.key) {
        case 'Home':
          setCurrentIndex(0);
          break;
        case 'End':
          setCurrentIndex(
            menuItemRefs.current!.length ? menuItemRefs.current!.length - 1 : 0
          );
          break;
        case 'ArrowDown':
          setCurrentIndex((index) => {
            if (index + 1 < menuItemRefs.current!.length) {
              return index + 1;
            } else {
              return 0;
            }
          });
          break;
        case 'ArrowUp':
          setCurrentIndex((index) => {
            if (index - 1 > -1) {
              return index - 1;
            } else {
              return menuItemRefs.current!.length - 1;
            }
          });
          break;
        case 'Escape':
          closeMenu();
          break;
      }
    };

    useEffect(() => {
      if (menuItemRefs.current[currentIndex]) {
        menuItemRefs.current[currentIndex]?.focus();
      }
    }, [currentIndex]);

    const pushRefToArray: RefCallback<HTMLLIElement> = (instance) => {
      if (instance && instance.children) {
        Array.from(instance.children).forEach((child) => {
          if (
            child.getAttribute('role')?.includes('menuitem') &&
            !menuItemRefs.current!.includes(child as HTMLButtonElement)
          ) {
            menuItemRefs.current!.push(child as HTMLButtonElement);
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
        ref={ref}
        style={style}
        aria-label={a11yLabel}
      >
        {Array.isArray(children) ? children.map(mapMenuItems) : null}
      </menu>
    );
  }
);
