import { classNames } from '@standardnotes/utils'

export const PopoverClassNames = classNames(
  'z-dropdown-menu w-full',
  'cursor-auto flex-col overflow-y-auto rounded bg-default h-auto',
)

export const PopoverItemClassNames = classNames(
  'flex w-full items-center text-base overflow-hidden hover:bg-contrast hover:text-foreground',
  'cursor-pointer m-0 focus:bg-info focus:text-info-contrast',
)
