export function keyboardCharacterForKeyOrCode(keyOrCode: string) {
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
    default:
      return keyOrCode
  }
}
