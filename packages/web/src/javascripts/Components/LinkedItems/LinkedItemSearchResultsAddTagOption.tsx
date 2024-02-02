import { classNames } from '@standardnotes/utils'
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef } from 'react'
import Icon from '../Icon/Icon'

type Props = {
  searchQuery: string
  onClickCallback?: (searchQuery: string) => void
  isFocused?: boolean
} & ComponentPropsWithoutRef<'button'>

export const LinkedItemSearchResultsAddTagOption = forwardRef(
  ({ searchQuery, onClickCallback, isFocused, ...props }: Props, ref: ForwardedRef<HTMLButtonElement>) => {
    return (
      <button
        className={classNames(
          'group flex w-full items-center gap-2 overflow-hidden px-3 py-2 hover:bg-contrast hover:text-foreground',
          'focus:bg-info-backdrop [&[data-active-item]]:bg-info-backdrop',
        )}
        onClick={() => {
          if (onClickCallback) {
            onClickCallback(searchQuery)
          }
        }}
        ref={ref}
        {...props}
      >
        <span className="flex-shrink-0 align-middle text-sm lg:text-xs">Create &amp; add tag</span>{' '}
        <span
          className={classNames(
            'inline-flex min-w-0 items-center gap-1 rounded py-1 pl-1 pr-2 align-middle text-xs ',
            'group-hover:bg-info group-hover:text-info-contrast',
            isFocused ? 'bg-info text-info-contrast' : 'bg-contrast text-text',
          )}
        >
          <Icon
            type="hashtag"
            className={classNames(
              'flex-shrink-0 group-hover:text-info-contrast',
              isFocused ? 'text-info-contrast' : 'text-info',
            )}
            size="small"
          />
          <span className="min-w-0 overflow-hidden text-ellipsis">{searchQuery}</span>
        </span>
      </button>
    )
  },
)
