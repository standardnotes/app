import { classNames } from '@standardnotes/utils'

export const PopoverClassNames =
  'max-h-[min(var(--popover-available-height,_50vh),_50vh)] w-[--popover-available-width] overflow-y-auto rounded border border-[--popover-border-color] bg-default shadow-main [backdrop-filter:var(--popover-backdrop-filter)] md:max-w-xs md:bg-[--popover-background-color]'

export const PopoverItemClassNames = classNames(
  'flex w-full items-center text-base overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground',
  'focus:bg-info-backdrop cursor-pointer m-0 focus:bg-contrast focus:text-foreground',
)

export const PopoverItemSelectedClassNames = classNames('bg-contrast text-foreground')
