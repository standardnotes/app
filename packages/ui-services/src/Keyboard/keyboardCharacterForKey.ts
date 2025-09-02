export function keyboardCharacterForKeyOrCode(keyOrCode: string, shiftKey = false) {
  if (keyOrCode.startsWith('Digit')) {
    return keyOrCode.replace('Digit', '')
  }
  if (keyOrCode.startsWith('Key')) {
    return keyOrCode.replace('Key', '')
  }
  switch (keyOrCode) {
    case 'ArrowDown':
      return '↓'
    case 'ArrowUp':
      return '↑'
    case 'ArrowLeft':
      return '←'
    case 'ArrowRight':
      return '→'
    case 'Semicolon':
      return shiftKey ? ':' : ';'
    default:
      return keyOrCode
  }
}
