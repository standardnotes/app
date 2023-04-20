import Icon from '@/Components/Icon/Icon'

export const SuccessPrompt = ({
  ctaRef,
  onClose,
}: {
  ctaRef: React.RefObject<HTMLButtonElement>
  onClose: () => void
}) => {
  return (
    <>
      <div>
        <div className="flex justify-end p-1">
          <button
            className="flex cursor-pointer border-0 bg-transparent p-0"
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon className="text-neutral" type="close" />
          </button>
        </div>
        <div
          className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[50%] bg-contrast"
          aria-hidden={true}
        >
          <Icon className={'h-24 w-24 px-7 py-2 text-[50px]'} size={'custom'} type={'🎉'} />
        </div>
        <div className="mb-1 text-center text-lg font-bold">Your purchase was successful!</div>
      </div>

      <div className="mb-2 px-4.5 text-center text-sm text-passive-1">Enjoy your new powered up experience.</div>

      <div className="p-4">
        <button
          onClick={onClose}
          className="no-border w-full cursor-pointer rounded bg-info py-2 font-bold text-info-contrast hover:brightness-125 focus:brightness-125"
          ref={ctaRef}
        >
          Continue
        </button>
      </div>
    </>
  )
}
