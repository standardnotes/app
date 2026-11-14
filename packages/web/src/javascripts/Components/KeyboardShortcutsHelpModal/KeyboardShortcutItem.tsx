import { c } from 'ttag'
import { KeyboardShortcutHelpItem } from '@standardnotes/ui-services'
import { classNames } from '@standardnotes/snjs'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import IconButton from '../Button/IconButton'

export const isBound = (item: KeyboardShortcutHelpItem) => !!item.key || !!item.code

type Props = {
  item: KeyboardShortcutHelpItem
  editable: boolean
  isRecording: boolean
  recordingHint: string | undefined
  conflicts: string[]
  onToggleRecording: () => void
  onUnbind: () => void
}

const KeyboardShortcutItem = ({
  item,
  editable,
  isRecording,
  recordingHint,
  conflicts,
  onToggleRecording,
  onUnbind,
}: Props) => {
  const bound = isBound(item)
  const conflictList = conflicts.join(', ')

  const shortcut = isRecording ? (
    <span className="text-sm text-info">{c('B2.NavSharedUI.Status').t`Press a key combination…`}</span>
  ) : bound ? (
    <KeyboardShortcutIndicator shortcut={item} small={false} dimmed={false} />
  ) : (
    <span className="text-sm text-passive-0">{c('B2.NavSharedUI.Status').t`Not set`}</span>
  )

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div>{item.description}</div>
        <div className="ml-auto flex items-center gap-1">
          {editable ? (
            <button
              type="button"
              className={classNames(
                'rounded border border-transparent px-1.5 py-1 hover:border-border hover:bg-contrast focus:shadow-none focus-visible:border-info',
                isRecording && 'border-info bg-contrast',
              )}
              title={
                isRecording
                  ? c('B2.NavSharedUI.Action').t`Cancel`
                  : c('B2.NavSharedUI.Action').t`Click to change shortcut`
              }
              onClick={onToggleRecording}
            >
              {shortcut}
            </button>
          ) : (
            <div className="px-1.5 py-1">{shortcut}</div>
          )}
          {isRecording && bound && (
            <button
              type="button"
              className="rounded border border-border px-1.5 py-0.5 text-sm text-passive-0 hover:bg-contrast hover:text-text focus:shadow-none focus-visible:border-info"
              title={c('B2.NavSharedUI.Action').t`Assign no shortcut`}
              onClick={onUnbind}
            >
              {c('B2.NavSharedUI.Action').t`None`}
            </button>
          )}
          {isRecording && (
            <IconButton
              icon="close"
              title={c('B2.NavSharedUI.Action').t`Cancel`}
              focusable={true}
              onClick={onToggleRecording}
              iconClassName="text-passive-1"
            />
          )}
        </div>
      </div>
      {isRecording && recordingHint && <div className="mt-1 text-right text-sm text-warning">{recordingHint}</div>}
      {!isRecording && conflicts.length > 0 && (
        <div className="mt-1 text-right text-sm text-warning">
          {c('B2.NavSharedUI.Warning').t`Also used by: ${conflictList}`}
        </div>
      )}
    </div>
  )
}

export default KeyboardShortcutItem
