export function GetRemoteImageBlock(onSelect: () => void) {
  return {
    name: 'Image from URL',
    iconName: 'file-image',
    iconClassName: '!text-current',
    keywords: ['image', 'url'],
    onSelect,
  }
}
