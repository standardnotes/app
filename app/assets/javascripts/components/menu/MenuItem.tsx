import {
  ComponentChild,
  ComponentChildren,
  FunctionComponent,
  VNode,
} from 'preact';
import { forwardRef, Ref } from 'preact/compat';
import { JSXInternal } from 'preact/src/jsx';
import { Icon } from '../Icon';
import { Switch, SwitchProps } from '../Switch';
import { IconType } from '@standardnotes/snjs';

export enum MenuItemType {
  IconButton,
  RadioButton,
  SwitchButton,
}

type MenuItemProps = {
  type: MenuItemType;
  children: ComponentChildren;
  onClick?: JSXInternal.MouseEventHandler<HTMLButtonElement>;
  onChange?: SwitchProps['onChange'];
  className?: string;
  checked?: boolean;
  icon?: IconType;
  iconClassName?: string;
  tabIndex?: number;
};

export const MenuItem: FunctionComponent<MenuItemProps> = forwardRef(
  (
    {
      children,
      onClick,
      onChange,
      className = '',
      type,
      checked,
      icon,
      iconClassName,
      tabIndex,
    }: MenuItemProps,
    ref: Ref<HTMLButtonElement>
  ) => {
    return type === MenuItemType.SwitchButton &&
      typeof onChange === 'function' ? (
      <Switch
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={checked}
        onChange={onChange}
        role="menuitemcheckbox"
        tabIndex={typeof tabIndex === 'number' ? tabIndex : -1}
      >
        {children}
      </Switch>
    ) : (
      <button
        ref={ref}
        role={type === MenuItemType.RadioButton ? 'menuitemradio' : 'menuitem'}
        tabIndex={typeof tabIndex === 'number' ? tabIndex : -1}
        className={`sn-dropdown-item focus:bg-info-backdrop focus:shadow-none ${className}`}
        onClick={onClick}
        {...(type === MenuItemType.RadioButton
          ? { 'aria-checked': checked }
          : {})}
      >
        {type === MenuItemType.IconButton && icon ? (
          <Icon type={icon} className={iconClassName} />
        ) : null}
        {type === MenuItemType.RadioButton && typeof checked === 'boolean' ? (
          <div
            className={`pseudo-radio-btn ${
              checked ? 'pseudo-radio-btn--checked' : ''
            } mr-2`}
          ></div>
        ) : null}
        {children}
      </button>
    );
  }
);

export const MenuItemSeparator: FunctionComponent = () => (
  <div role="separator" className="h-1px my-2 bg-border"></div>
);

type ListElementProps = {
  isFirstMenuItem: boolean;
  children: ComponentChildren;
};

export const MenuItemListElement: FunctionComponent<ListElementProps> =
  forwardRef(({ children, isFirstMenuItem }: ListElementProps, ref: Ref<HTMLLIElement>) => {
    const child = children as VNode<unknown>;

    return (
      <li className="list-style-none" role="none" ref={ref}>
        {{
          ...child,
          props: {
            ...(child.props ? { ...child.props } : {}),
            ...(child.type === MenuItem
              ? {
                  tabIndex: isFirstMenuItem ? 0 : -1,
                }
              : {}),
          },
        }}
      </li>
    );
  });
