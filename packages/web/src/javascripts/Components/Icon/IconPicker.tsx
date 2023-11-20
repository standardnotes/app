import { classNames } from '@standardnotes/utils'
import { EmojiString, Platform, VectorIconNameOrEmoji } from '@standardnotes/snjs'
import { ForwardedRef, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Dropdown from '../Dropdown/Dropdown'
import { DropdownItem } from '../Dropdown/DropdownItem'
import { getEmojiLength } from './EmojiLength'
import Icon, { isIconEmoji } from './Icon'
import { IconNameToSvgMapping } from './IconNameToSvgMapping'
import { IconPickerType } from './IconPickerType'
import DecoratedInput from '../Input/DecoratedInput'

type Props = {
  selectedValue: VectorIconNameOrEmoji
  onIconChange: (value?: VectorIconNameOrEmoji) => void
  platform: Platform
  useIconGrid?: boolean
  iconGridClassName?: string
  className?: string
  autoFocus?: boolean
}

const TabButton = forwardRef(
  (
    {
      type,
      label,
      currentType,
      selectTab,
    }: {
      label: string
      type: IconPickerType | 'reset'
      currentType: IconPickerType
      selectTab: (type: IconPickerType | 'reset') => void
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

const IconPicker = ({
  selectedValue,
  onIconChange,
  platform,
  className,
  useIconGrid,
  iconGridClassName,
  autoFocus,
}: Props) => {
  const iconKeys = useMemo(() => Object.keys(IconNameToSvgMapping), [])

  const iconOptions = useMemo(
    () =>
      iconKeys.map(
        (value) =>
          ({
            label: value,
            value: value,
            icon: value,
          }) as DropdownItem,
      ),
    [iconKeys],
  )

  const isSelectedEmoji = isIconEmoji(selectedValue)
  const isMacOS = platform === Platform.MacWeb || platform === Platform.MacDesktop
  const isWindows = platform === Platform.WindowsWeb || platform === Platform.WindowsDesktop

  const emojiInputRef = useRef<HTMLInputElement>(null)
  const [emojiInputFocused, setEmojiInputFocused] = useState(true)
  const [currentType, setCurrentType] = useState<IconPickerType>(isSelectedEmoji ? 'emoji' : 'icon')
  const [emojiInputValue, setEmojiInputValue] = useState(isSelectedEmoji ? selectedValue : '')

  useEffect(() => {
    setEmojiInputValue(isSelectedEmoji ? selectedValue : '')
  }, [isSelectedEmoji, selectedValue])

  const selectTab = (type: IconPickerType | 'reset') => {
    if (type === 'reset') {
      onIconChange(undefined)
      setEmojiInputValue('')
    } else {
      setCurrentType(type)
    }
  }

  const handleIconChange = (value: string) => {
    onIconChange(value)
  }

  const handleEmojiChange = (value: EmojiString) => {
    setEmojiInputValue(value)

    const emojiLength = getEmojiLength(value as string)
    if (emojiLength === 1) {
      onIconChange(value)
      emojiInputRef.current?.blur()
      setEmojiInputFocused(false)
    } else {
      setEmojiInputFocused(true)
    }
  }

  const focusOnMount = useCallback((element: HTMLButtonElement | null) => {
    if (element) {
      setTimeout(() => {
        element.focus()
      })
    }
  }, [])

  return (
    <div className={`flex h-full flex-grow flex-col ${className}`}>
      <div className="flex">
        <TabButton label="Icon" type={'icon'} currentType={currentType} selectTab={selectTab} />
        <TabButton label="Emoji" type={'emoji'} currentType={currentType} selectTab={selectTab} />
        <TabButton label="Reset" type={'reset'} currentType={currentType} selectTab={selectTab} />
      </div>
      <div className={classNames('mt-1 h-full min-h-0', currentType === 'icon' && 'overflow-auto')}>
        {currentType === 'icon' &&
          (useIconGrid ? (
            <div
              className={classNames(
                'flex w-full flex-wrap items-center gap-6 p-1 md:max-h-24 md:gap-4 md:p-0',
                iconGridClassName,
              )}
            >
              {iconKeys.map((iconName, index) => (
                <button
                  key={iconName}
                  onClick={() => {
                    handleIconChange(iconName)
                  }}
                  ref={index === 0 ? focusOnMount : undefined}
                >
                  <Icon type={iconName} />
                </button>
              ))}
            </div>
          ) : (
            <Dropdown
              fullWidth={true}
              label="Change the icon for a tag"
              items={iconOptions}
              value={selectedValue as string}
              onChange={handleIconChange}
            />
          ))}
        {currentType === 'emoji' && (
          <>
            <DecoratedInput
              ref={emojiInputRef}
              autocomplete={false}
              autofocus={autoFocus ?? emojiInputFocused}
              type="text"
              value={emojiInputValue as string}
              onChange={(value) => handleEmojiChange(value)}
            />
            <div className="mt-2 text-sm text-passive-0 lg:text-xs">
              Use your keyboard to enter or paste in an emoji character.
            </div>
            {isMacOS && (
              <div className="mt-2 text-sm text-passive-0 lg:text-xs">
                On macOS: ⌘ + ⌃ + Space bar to bring up emoji picker.
              </div>
            )}
            {isWindows && (
              <div className="mt-2 text-sm text-passive-0 lg:text-xs">
                On Windows: Windows key + . to bring up emoji picker.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default IconPicker
