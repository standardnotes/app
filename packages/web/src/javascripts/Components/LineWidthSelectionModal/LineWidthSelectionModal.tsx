import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { classNames } from '@standardnotes/snjs'
import { useMemo, useState } from 'react'
import Button from '../Button/Button'
import Modal, { ModalAction } from '../Modal/Modal'
import ModalDialogButtons from '../Modal/ModalDialogButtons'
import ModalOverlay from '../Modal/ModalOverlay'
import RadioButtonGroup from '../RadioButtonGroup/RadioButtonGroup'

const DoubleSidedArrow = ({ className }: { className?: string }) => {
  return (
    <div
      className={classNames(
        'relative h-[2px] w-full bg-current',
        'before:absolute before:left-0 before:top-1/2 before:h-0 before:w-0 before:-translate-y-1/2 before:border-r-[6px] before:border-t-[6px] before:border-b-[6px] before:border-current before:border-b-transparent before:border-t-transparent',
        'after:absolute after:right-0 after:top-1/2 after:h-0 after:w-0 after:-translate-y-1/2 after:border-l-[6px] after:border-t-[6px] after:border-b-[6px] after:border-current after:border-b-transparent after:border-t-transparent',
        className,
      )}
    />
  )
}

const LineWidthSelectionModal = () => {
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const [value, setValue] = useState<'narrow' | 'wide' | 'dynamic' | 'full-width'>('dynamic')

  const options = useMemo(
    () => [
      {
        label: 'Narrow',
        value: 'narrow',
      },
      {
        label: 'Wide',
        value: 'wide',
      },
      {
        label: 'Dynamic',
        value: 'dynamic',
      },
      {
        label: 'Full width',
        value: 'full-width',
      },
    ],
    [],
  )

  const cancel = () => {
    //
  }

  const accept = () => {
    //
  }

  const actions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Cancel',
        type: 'cancel',
        onClick: cancel,
        mobileSlot: 'left',
      },
      {
        label: 'Done',
        type: 'primary',
        onClick: accept,
        mobileSlot: 'right',
      },
    ],
    [],
  )

  return (
    <ModalOverlay isOpen={true}>
      <Modal
        title="Set line width"
        close={() => {
          /*empty*/
        }}
        customHeader={<></>}
        customFooter={<></>}
        disableCustomHeader={isMobileScreen}
        actions={actions}
        className={{
          content: 'md:min-w-[40vw]',
          description: 'flex min-h-[50vh] flex-col',
        }}
      >
        <div className="flex min-h-0 flex-grow flex-col overflow-hidden rounded bg-passive-5 p-4 pb-0">
          <div
            className={classNames(
              'grid flex-grow grid-cols-[0fr_1fr_0fr] gap-3 rounded rounded-b-none bg-default px-2 pt-4 shadow-[0_1px_4px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 md:px-4',
              value === 'narrow' && 'md:grid-cols-[1fr_60%_1fr]',
              value === 'wide' && 'md:grid-cols-[1fr_70%_1fr]',
              value === 'dynamic' && 'md:grid-cols-[1fr_80%_1fr]',
              value === 'full-width' && 'md:grid-cols-[1fr_95%_1fr]',
            )}
          >
            <div className="text-center text-passive-2">
              <div className={value !== 'dynamic' ? 'hidden' : ''}>
                <div className="mb-2">10%</div>
                <DoubleSidedArrow />
              </div>
            </div>
            <div className="flex flex-col text-info">
              <div className="mb-2 text-center text-sm">
                {value === 'narrow' && 'Max. 512px'}
                {value === 'wide' && 'Max. 720px'}
                {value === 'dynamic' && '80%'}
                {value === 'full-width' && '100%'}
              </div>
              <DoubleSidedArrow />
              <div className="w-full flex-grow bg-[linear-gradient(transparent_50%,var(--sn-stylekit-info-color)_50%)] bg-[length:100%_2.5rem] bg-repeat-y opacity-10" />
            </div>
            <div className="text-center text-passive-2">
              <div className={value !== 'dynamic' ? 'hidden' : ''}>
                <div className="mb-2">10%</div>
                <DoubleSidedArrow />
              </div>
            </div>
          </div>
        </div>
        <ModalDialogButtons className="justify-center md:justify-between">
          <RadioButtonGroup
            items={options}
            value={value}
            onChange={(value) => setValue(value as 'narrow' | 'wide' | 'dynamic' | 'full-width')}
          />
          <div className="hidden items-center gap-2 md:flex">
            <Button>Cancel</Button>
            <Button primary>OK</Button>
          </div>
        </ModalDialogButtons>
      </Modal>
    </ModalOverlay>
  )
}

export default LineWidthSelectionModal
