import { classNames } from '@/Utils/ConcatenateClassNames'

export const PopoverClassNames = classNames(
  'z-dropdown-menu w-full',
  'cursor-auto flex-col overflow-y-auto rounded bg-default md:h-auto h-auto overflow-y-scroll',
)

export const PopoverItemClassNames = classNames(
  'flex w-full items-center text-base overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground',
  'focus:bg-info-backdrop cursor-pointer m-0 focus:bg-contrast focus:text-foreground',
)

export const PopoverItemSelectedClassNames = classNames('bg-contrast text-foreground')
