import {
  PlatformedKeyboardShortcut,
  keyboardCharacterForModifier,
  isMacPlatform,
  isMobilePlatform,
} from '@standardnotes/ui-services'
import { useMemo } from 'react'

type Props = {
  shortcut: PlatformedKeyboardShortcut
  className?: string
}

export const KeyboardShortcutIndicator = ({ shortcut, className }: Props) => {
  const addPluses = !isMacPlatform(shortcut.platform)
  const spacingClass = addPluses ? '' : 'ml-0.5'

  const keys = useMemo(() => {
    const modifiers = shortcut.modifiers || []
    const primaryKey = (shortcut.key || '').toUpperCase()

    const results: string[] = []
    modifiers.forEach((modifier, index) => {
      results.push(keyboardCharacterForModifier(modifier, shortcut.platform))

      if (addPluses && (primaryKey || index !== modifiers.length - 1)) {
        results.push('+')
      }
    })

    if (primaryKey) {
      results.push(primaryKey)
    }

    return results
  }, [shortcut, addPluses])

  if (isMobilePlatform(shortcut.platform)) {
    return null
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
