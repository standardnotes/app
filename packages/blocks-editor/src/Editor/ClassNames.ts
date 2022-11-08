const classNames = (...values: (string | boolean | undefined)[]): string => {
  return values
    .map((value) => (typeof value === 'string' ? value : null))
    .join(' ');
};

export const PopoverClassNames = classNames(
  'typeahead-popover mt-[25px] file-picker-menu absolute top-0 left-0 z-dropdown-menu flex w-full min-w-80',
  'cursor-auto flex-col overflow-y-auto rounded bg-default shadow-main md:h-auto md:max-w-xs max-h-80 overflow-y-scroll',
);

export const PopoverItemClassNames = classNames(
  'flex w-full items-center text-base gap-4 overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground',
  'focus:bg-info-backdrop cursor-pointer m-0',
);

export const ComponentPopoverIconClassNames = classNames(
  'flex w-5 h-5 mr-[8px] bg-contain fill-current text-center',
);
export const ComponentPopoverTitleClassNames = classNames('');
