const classNames = (...values: (string | boolean | undefined)[]): string => {
  return values
    .map((value) => (typeof value === 'string' ? value : null))
    .join(' ');
};

export const PopoverClassNames = classNames(
  'typeahead-popover file-picker-menu absolute z-dropdown-menu flex w-full min-w-80',
  'cursor-auto flex-col overflow-y-auto rounded bg-default md:h-auto md:max-w-xs h-auto overflow-y-scroll',
);

export const PopoverItemClassNames = classNames(
  'flex w-full items-center text-base gap-4 overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground',
  'focus:bg-info-backdrop cursor-pointer m-0 focus:bg-contrast focus:text-foreground',
);

export const PopoverItemSelectedClassNames = classNames(
  'bg-contrast text-foreground',
);
