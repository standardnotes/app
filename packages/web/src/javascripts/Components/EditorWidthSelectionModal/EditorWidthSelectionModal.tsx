import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { classNames, EditorLineWidth } from '@standardnotes/snjs'
import { useCallback, useMemo, useState } from 'react'
import Button from '../Button/Button'
import Modal, { ModalAction } from '../Modal/Modal'
import ModalDialogButtons from '../Modal/ModalDialogButtons'
import RadioButtonGroup from '../RadioButtonGroup/RadioButtonGroup'
import { EditorMargins, EditorMaxWidths } from './EditorWidths'

const DoubleSidedArrow = ({ className }: { className?: string }) => {
  return (
    <div
      className={classNames(
        'relative h-[2px] w-full bg-current',
        'before:absolute before:-left-px before:top-1/2 before:h-0 before:w-0 before:-translate-y-1/2 before:border-r-[6px] before:border-t-[6px] before:border-b-[6px] before:border-current before:border-b-transparent before:border-t-transparent',
        'after:absolute after:-right-px after:top-1/2 after:h-0 after:w-0 after:-translate-y-1/2 after:border-l-[6px] after:border-t-[6px] after:border-b-[6px] after:border-current after:border-b-transparent after:border-t-transparent',
        className,
      )}
    />
  )
}

const EditorWidthSelectionModal = ({
  initialValue,
  handleChange,
  close,
}: {
  initialValue: EditorLineWidth
  handleChange: (value: EditorLineWidth) => void
  close: () => void
}) => {
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const [value, setValue] = useState<EditorLineWidth>(() => initialValue)

  const options = useMemo(
    () => [
      {
        label: 'Narrow',
        value: EditorLineWidth.Narrow,
      },
      {
        label: 'Wide',
        value: EditorLineWidth.Wide,
      },
      {
        label: 'Dynamic',
        value: EditorLineWidth.Dynamic,
      },
      {
        label: 'Full width',
        value: EditorLineWidth.FullWidth,
      },
    ],
    [],
  )

  const accept = useCallback(() => {
    handleChange(value)
    close()
  }, [close, handleChange, value])

  const actions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Cancel',
        type: 'cancel',
        onClick: close,
        mobileSlot: 'left',
      },
      {
        label: 'Done',
        type: 'primary',
        onClick: accept,
        mobileSlot: 'right',
      },
    ],
    [accept, close],
  )

  const DynamicMargin = (
    <div className="text-center text-sm text-passive-2">
      <div className={value !== EditorLineWidth.Dynamic ? 'hidden' : ''}>
        <div className="mb-2">{EditorMargins[value]}</div>
        <DoubleSidedArrow />
      </div>
    </div>
  )

  return (
    <Modal
      title="Set editor width"
      close={close}
      customHeader={<></>}
      customFooter={<></>}
      disableCustomHeader={isMobileScreen}
      actions={actions}
      className={{
        content: 'select-none md:min-w-[40vw]',
        description: 'flex min-h-[50vh] flex-col',
      }}
    >
      <div className="flex min-h-0 flex-grow flex-col overflow-hidden rounded bg-passive-5 p-4 pb-0">
        <div
          className={classNames(
            'grid flex-grow grid-cols-[0fr_1fr_0fr] gap-3 rounded rounded-b-none bg-default px-2 pt-4 shadow-[0_1px_4px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 md:px-4',
            value === EditorLineWidth.Narrow && 'md:grid-cols-[1fr_60%_1fr]',
            value === EditorLineWidth.Wide && 'md:grid-cols-[1fr_70%_1fr]',
            value === EditorLineWidth.Dynamic && 'md:grid-cols-[1fr_80%_1fr]',
            value === EditorLineWidth.FullWidth && 'md:grid-cols-[1fr_95%_1fr]',
          )}
        >
          {DynamicMargin}
          <div className="flex flex-col text-info">
            <div className="mb-2 text-center text-sm">
              {value === EditorLineWidth.Narrow || value === EditorLineWidth.Wide
                ? `Max. ${EditorMaxWidths[value]}`
                : EditorMaxWidths[value]}
            </div>
            <DoubleSidedArrow />
            <div className="w-full flex-grow bg-[linear-gradient(transparent_50%,var(--sn-stylekit-info-color)_50%)] bg-[length:100%_2.5rem] bg-repeat-y opacity-10" />
          </div>
          {DynamicMargin}
        </div>
      </div>
      <ModalDialogButtons className="justify-center md:justify-between">
        <RadioButtonGroup items={options} value={value} onChange={(value) => setValue(value as EditorLineWidth)} />
        <div className="hidden items-center gap-2 md:flex">
          <Button onClick={close}>Cancel</Button>
          <Button onClick={accept} primary>
            OK
          </Button>
        </div>
      </ModalDialogButtons>
    </Modal>
  )
}

export default EditorWidthSelectionModal
