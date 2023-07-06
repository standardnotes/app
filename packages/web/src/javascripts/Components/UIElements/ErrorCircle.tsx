import Icon from '@/Components/Icon/Icon'

export const ErrorCircle = () => {
  return (
    <button
      className={
        'peer flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-danger text-danger-contrast'
      }
    >
      <Icon type={'warning'} size="small" />
    </button>
  )
}
