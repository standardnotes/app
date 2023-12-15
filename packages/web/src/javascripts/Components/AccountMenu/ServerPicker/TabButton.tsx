import { ForwardedRef, forwardRef } from 'react'
import { ServerType } from './ServerType'

export const TabButton = forwardRef(
  (
    {
      type,
      label,
      currentType,
      selectTab,
    }: {
      label: string
      type: ServerType
      currentType: ServerType
      selectTab: (type: ServerType) => void
    },
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    const isSelected = currentType === type

    return (
      <button
        className={`relative mr-2 cursor-pointer border-0 pb-1.5 text-mobile-menu-item focus:shadow-none md:text-tablet-menu-item lg:text-menu-item ${
          isSelected ? 'font-medium text-info' : 'text-text'
        }`}
        onClick={() => {
          selectTab(type)
        }}
        ref={ref}
      >
        {label}
      </button>
    )
  },
)
