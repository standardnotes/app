import Icon from '@/Components/Icon/Icon'

export const WarningCircle = () => {
  return (
    <button
      className={
        'peer flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-warning text-warning-contrast'
      }
    >
      <Icon type={'warning'} size="small" />
    </button>
  )
}
