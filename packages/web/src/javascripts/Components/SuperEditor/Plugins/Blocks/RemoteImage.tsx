export function GetRemoteImageBlock(onSelect: () => void) {
  return {
    name: 'Image from URL',
    iconName: 'image',
    keywords: ['image', 'url'],
    onSelect,
  }
}
