/**
 * @jest-environment jsdom
 */

import { Environment, Platform } from '@standardnotes/models'
import { getKeyboardShortcuts } from './getKeyboardShortcuts'
import { SCROLL_NOTE_TO_BOTTOM_KEYBOARD_COMMAND } from './KeyboardCommands'
import { KeyboardKey } from './KeyboardKey'
import { KeyboardModifier } from './KeyboardModifier'

describe('scroll note to bottom shortcut', () => {
  const getShortcut = (platform: Platform) =>
    getKeyboardShortcuts(platform, Environment.Web).find(
      (shortcut) => shortcut.command === SCROLL_NOTE_TO_BOTTOM_KEYBOARD_COMMAND,
    )

  it.each([Platform.MacWeb, Platform.MacDesktop])('is Cmd+Down on %s', (platform) => {
    expect(getShortcut(platform)).toMatchObject({ key: KeyboardKey.Down, modifiers: [KeyboardModifier.Meta] })
  })

  it.each([Platform.WindowsWeb, Platform.WindowsDesktop, Platform.LinuxWeb, Platform.LinuxDesktop])(
    'is Ctrl+End on %s',
    (platform) => {
      expect(getShortcut(platform)).toMatchObject({ key: KeyboardKey.End, modifiers: [KeyboardModifier.Ctrl] })
    },
  )
})
