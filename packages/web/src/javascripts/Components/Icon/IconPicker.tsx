import { EmojiString, Platform, VectorIconNameOrEmoji } from '@standardnotes/snjs'
import { FunctionComponent, useMemo, useRef, useState } from 'react'
import Dropdown from '../Dropdown/Dropdown'
import { DropdownItem } from '../Dropdown/DropdownItem'
import { getEmojiLength } from './EmojiLength'
import { isIconEmoji } from './Icon'
import { IconNameToSvgMapping } from './IconNameToSvgMapping'
import { IconPickerType } from './IconPickerType'

type Props = {
  selectedValue: VectorIconNameOrEmoji
  onIconChange: (value?: string) => void
  platform: Platform
  portalDropdown?: boolean
  className?: string
}

const IconPicker = ({ selectedValue, onIconChange, platform, className, portalDropdown }: Props) => {
  const iconOptions = useMemo(
    () =>
      [...Object.keys(IconNameToSvgMapping)].map(
        (value) =>
          ({
            label: value,
            value: value,
            icon: value,
          } as DropdownItem),
      ),
    [],
  )

  const isSelectedEmoji = isIconEmoji(selectedValue)
  const isMacOS = platform === Platform.MacWeb || platform === Platform.MacDesktop
  const isWindows = platform === Platform.WindowsWeb || platform === Platform.WindowsDesktop

  const emojiInputRef = useRef<HTMLInputElement>(null)
  const [emojiInputFocused, setEmojiInputFocused] = useState(true)
  const [currentType, setCurrentType] = useState<IconPickerType>(isSelectedEmoji ? 'emoji' : 'icon')
  const [emojiInputValue, setEmojiInputValue] = useState(isSelectedEmoji ? selectedValue : '')

  const selectTab = (type: IconPickerType | 'reset') => {
    if (type === 'reset') {
      onIconChange(undefined)
      setEmojiInputValue('')
    } else {
      setCurrentType(type)
    }
  }

  const TabButton: FunctionComponent<{
    label: string
    type: IconPickerType | 'reset'
  }> = ({ type, label }) => {
    const isSelected = currentType === type

    return (
      <button
        className={`relative mr-2 cursor-pointer border-0 bg-default pb-1.5 text-mobile-menu-item focus:shadow-none md:text-tablet-menu-item lg:text-menu-item ${
          isSelected ? 'font-medium text-info' : 'text-text'
        }`}
        onClick={() => {
          selectTab(type)
        }}
      >
        {label}
      </button>
    )
  }

  const handleIconChange = (value: string) => {
    onIconChange(value)
  }

  const handleEmojiChange = (value: EmojiString) => {
    setEmojiInputValue(value)

    const emojiLength = getEmojiLength(value)
    if (emojiLength === 1) {
      onIconChange(value)
      emojiInputRef.current?.blur()
      setEmojiInputFocused(false)
    } else {
      setEmojiInputFocused(true)
    }
  }

  return (
    <div className={`flex h-full flex-grow flex-col overflow-auto ${className}`}>
      <div className="flex">
        <TabButton label="Icon" type={'icon'} />
        <TabButton label="Emoji" type={'emoji'} />
        <TabButton label="Reset" type={'reset'} />
      </div>
      <div className={'mt-2 h-full min-h-0 overflow-auto'}>
        {currentType === 'icon' && (
          <Dropdown
            fullWidth={true}
            id="change-tag-icon-dropdown"
            label="Change the icon for a tag"
            items={iconOptions}
            value={selectedValue}
            onChange={handleIconChange}
            portal={portalDropdown}
          />
        )}
        {currentType === 'emoji' && (
          <>
            <div>
              <input
                ref={emojiInputRef}
                autoComplete="off"
                autoFocus={emojiInputFocused}
                className="w-full flex-grow rounded border border-solid border-passive-3 bg-default px-2 py-1 text-base font-bold text-text focus:shadow-none focus:outline-none"
                type="text"
                value={emojiInputValue}
                onChange={({ target: input }) => handleEmojiChange((input as HTMLInputElement)?.value)}
              />
            </div>
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
