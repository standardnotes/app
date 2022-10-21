import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { FunctionComponent, useMemo, useState } from 'react'
import Dropdown from '../Dropdown/Dropdown'
import { DropdownItem } from '../Dropdown/DropdownItem'
import { IconNameToSvgMapping } from './IconNameToSvgMapping'
import { IconPickerType } from './IconPickerType'

type Props = {
  initialType: IconPickerType
  selectedValue: string
  onIconChange: (value: string) => void
}

const IconPicker = ({ initialType, selectedValue, onIconChange }: Props) => {
  const [currentType, setCurrentType] = useState<IconPickerType>(initialType)

  const selectTab = (type: IconPickerType) => {
    setCurrentType(type)
  }

  const TabButton: FunctionComponent<{
    label: string
    type: IconPickerType
  }> = ({ type, label }) => {
    const isSelected = currentType === type

    return (
      <button
        className={`relative cursor-pointer border-0 bg-default px-3 pb-1.5 text-sm focus:shadow-inner ${
          isSelected ? 'font-medium text-info shadow-bottom' : 'text-text'
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

  const handleEmojiChange = (value: EmojiClickData) => {
    onIconChange(value.emoji)
  }

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

  const CurrentTabList = () => {
    switch (currentType) {
      case 'icon':
        return (
          <>
            <Dropdown
              id="change-tag-icon"
              label="Change the icon for a tag"
              items={iconOptions}
              value={selectedValue}
              onChange={handleIconChange}
            />
          </>
        )
      case 'emoji':
        return (
          <EmojiPicker
            key={'emoji-picker'}
            onEmojiClick={handleEmojiChange}
            width={300}
            previewConfig={{ defaultCaption: '', defaultEmoji: '' }}
          />
        )
    }
  }

  return (
    <div className={'flex h-full flex-grow flex-col overflow-auto'}>
      <div className="flex border-b border-solid border-border">
        <TabButton label="Icon" type={'icon'} />
        <TabButton label="Emoji" type={'emoji'} />
      </div>
      <div className={'mt-2 h-full min-h-0 overflow-auto'}>
        <CurrentTabList />
      </div>
    </div>
  )
}

export default IconPicker
