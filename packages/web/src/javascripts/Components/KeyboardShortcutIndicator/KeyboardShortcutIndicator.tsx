import { PlatformedKeyboardShortcut, keyboardCharacterForModifier } from '@standardnotes/ui-services'

type Props = {
  shortcut: PlatformedKeyboardShortcut
  className?: string
}

export const KeyboardShortcutIndicator = ({ shortcut, className }: Props) => {
  const modifiers = shortcut.modifiers || []
  const key = (shortcut.key || '').toUpperCase()
  const spacingClass = 'ml-0.5'

  return (
    <div className={`keyboard-shortcut-indicator flex opacity-[0.35] ${className}`}>
      {modifiers.map((modifier, index) => {
        return (
          <div className={index !== 0 ? spacingClass : ''} key={modifier}>
            {keyboardCharacterForModifier(modifier, shortcut.platform)}
          </div>
        )
      })}
      {key && <span className={spacingClass}>{key}</span>}
    </div>
  )
}
