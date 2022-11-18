import { PlatformedKeyboardShortcut, keyboardCharacterForModifier, isMacPlatform } from '@standardnotes/ui-services'

type Props = {
  shortcut: PlatformedKeyboardShortcut
  className?: string
}

export const KeyboardShortcutIndicator = ({ shortcut, className }: Props) => {
  const modifiers = shortcut.modifiers || []
  const primaryKey = (shortcut.key || '').toUpperCase()
  const addPluses = !isMacPlatform(shortcut.platform)
  const spacingClass = addPluses ? '' : 'ml-0.5'

  const keys: string[] = []
  modifiers.forEach((modifier, index) => {
    keys.push(keyboardCharacterForModifier(modifier, shortcut.platform))

    if (addPluses && (primaryKey || index !== modifiers.length - 1)) {
      keys.push('+')
    }
  })

  if (primaryKey) {
    keys.push(primaryKey)
  }

  return (
    <div className={`keyboard-shortcut-indicator flex opacity-[0.35] ${className}`}>
      {keys.map((key, index) => {
        return (
          <div className={index !== 0 ? spacingClass : ''} key={index}>
            {key}
          </div>
        )
      })}
    </div>
  )
}
