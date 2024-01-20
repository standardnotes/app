import { classNames } from '@standardnotes/utils'

export const PopoverClassNames = classNames(
  'z-dropdown-menu w-full',
  'cursor-auto flex-col overflow-y-auto rounded bg-default h-auto',
)

export const PopoverItemClassNames = classNames(
  'flex w-full items-center text-base overflow-hidden py-2 px-3 hover:bg-info hover:text-info-contrast',
  'cursor-pointer m-0 focus:bg-info focus:text-info-contrast',
)

export const PopoverItemSelectedClassNames = classNames('bg-info text-info-contrast')
