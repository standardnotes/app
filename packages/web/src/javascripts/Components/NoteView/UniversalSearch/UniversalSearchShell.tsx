import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, CloseIcon } from '@standardnotes/icons'
import { classNames } from '@standardnotes/utils'
import { observer } from 'mobx-react-lite'
import { KeyboardEvent, useEffect, useRef } from 'react'
import Button from '../../Button/Button'
import Icon from '../../Icon/Icon'
import DecoratedInput from '../../Input/DecoratedInput'
import StyledTooltip from '../../StyledTooltip/StyledTooltip'
import { UniversalSearchController } from './UniversalSearchController'
import { UniversalSearchResultPayload } from './types'

interface UniversalSearchShellProps<TPayload = UniversalSearchResultPayload> {
  controller: UniversalSearchController<TPayload>
  locked: boolean
  className?: string
  position?: 'absolute' | 'inline'
  topMarginClassName?: string
  closeShortcut?: string
  replaceShortcut?: string
  caseSensitivityShortcut?: string
}

function statusLabel<TPayload = UniversalSearchResultPayload>(controller: UniversalSearchController<TPayload>): string {
  if (controller.status === 'loading') {
    return 'Loading'
  }

  if (controller.status === 'error') {
    return controller.error || 'Error'
  }

  if (!controller.query) {
    return ''
  }

  if (controller.results.length < 1) {
    return '0'
  }

  return `${controller.currentResultIndex + 1} / ${controller.results.length}`
}

export const UniversalSearchShell = observer(function UniversalSearchShell<TPayload = UniversalSearchResultPayload>({
  controller,
  locked,
  className,
  position = 'absolute',
  topMarginClassName,
  closeShortcut,
  replaceShortcut,
  caseSensitivityShortcut,
}: UniversalSearchShellProps<TPayload>) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)
  const wasOpenRef = useRef(false)
  const wasReplaceModeRef = useRef(false)

  useEffect(() => {
    controller.setLocked(locked)
  }, [controller, locked])

  useEffect(() => {
    if (controller.isOpen && !wasOpenRef.current) {
      searchInputRef.current?.focus()
    }

    wasOpenRef.current = controller.isOpen
  }, [controller.isOpen])

  useEffect(() => {
    if (controller.isOpen && controller.isReplaceMode && !wasReplaceModeRef.current) {
      replaceInputRef.current?.focus()
    }

    wasReplaceModeRef.current = controller.isReplaceMode
  }, [controller.isOpen, controller.isReplaceMode])

  const canReplace = controller.canReplace
  const canHighlightAll = controller.provider.capabilities.supportsHighlightAll
  const hasResults = controller.results.length > 0
  const hasReplaceQuery = controller.replaceQuery.length > 0

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !hasResults) {
      return
    }

    if (event.shiftKey) {
      controller.goToPreviousResult()
      event.preventDefault()
      return
    }

    controller.goToNextResult()
    event.preventDefault()
  }

  const handleReplaceKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !hasResults || !hasReplaceQuery || !canReplace) {
      return
    }

    if (event.ctrlKey && event.altKey) {
      void controller.replaceAllResults()
      event.preventDefault()
      return
    }

    void controller.replaceCurrentResult()
    event.preventDefault()
  }

  if (!controller.isOpen) {
    return null
  }

  const defaultTopMarginClassName = position === 'absolute' ? 'top-2 md:top-3' : 'mt-2 md:mt-3'

  return (
    <div
      className={classNames(
        'z-10 flex select-none rounded border border-border bg-default font-sans',
        position === 'absolute' ? 'absolute left-2 right-6 md:left-auto' : 'relative mx-2 mb-2 w-fit',
        topMarginClassName ?? defaultTopMarginClassName,
        className,
      )}
    >
      {canReplace && (
        <button
          className="focus:ring-none border-r border-border px-1 hover:bg-contrast focus:shadow-inner focus:shadow-info"
          onClick={controller.toggleReplaceMode}
          title={replaceShortcut ? `Toggle Replace Mode (${replaceShortcut})` : 'Toggle Replace Mode'}
          aria-label="Toggle replace mode"
        >
          {controller.isReplaceMode ? (
            <ArrowDownIcon className="h-4 w-4 fill-text" />
          ) : (
            <ArrowRightIcon className="h-4 w-4 fill-text" />
          )}
        </button>
      )}
      <div
        className="flex flex-col gap-2 px-2 py-2"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            controller.close()
          }
        }}
      >
        <div className="flex items-center gap-2">
          <DecoratedInput
            placeholder="Search"
            className={{
              container: classNames('flex-grow !text-[length:inherit]', !controller.query.length && '!py-1'),
              right: '!py-1',
            }}
            value={controller.query}
            onChange={controller.setQuery}
            onKeyDown={handleSearchKeyDown}
            ref={searchInputRef}
            right={[
              <div
                className="min-w-[7ch] max-w-[7ch] flex-shrink-0 whitespace-nowrap text-right"
                aria-live="polite"
                aria-label="Search status"
              >
                {statusLabel(controller)}
              </div>,
            ]}
          />
          <label
            className={classNames(
              'relative flex items-center rounded border px-1.5 py-1 focus-within:ring-2 focus-within:ring-info focus-within:ring-offset-2 focus-within:ring-offset-default',
              controller.isCaseSensitive ? 'border-info bg-info text-info-contrast' : 'border-border hover:bg-contrast',
            )}
            title={caseSensitivityShortcut ? `Case sensitive (${caseSensitivityShortcut})` : 'Case sensitive'}
          >
            <input
              type="checkbox"
              className="absolute left-0 top-0 z-[1] m-0 h-full w-full cursor-pointer border border-transparent p-0 opacity-0 shadow-none outline-none"
              checked={controller.isCaseSensitive}
              onChange={controller.toggleCaseSensitivity}
              aria-label="Case sensitive"
            />
            <span aria-hidden>Aa</span>
          </label>
          <button
            className="flex items-center rounded border border-border p-1.5 hover:bg-contrast disabled:cursor-not-allowed"
            onClick={controller.goToPreviousResult}
            disabled={!hasResults}
            title="Previous result (Shift + Enter)"
            aria-label="Previous result"
          >
            <ArrowUpIcon className="h-4 w-4 fill-current text-text" />
          </button>
          <button
            className="flex items-center rounded border border-border p-1.5 hover:bg-contrast disabled:cursor-not-allowed"
            onClick={controller.goToNextResult}
            disabled={!hasResults}
            title="Next result (Enter)"
            aria-label="Next result"
          >
            <ArrowDownIcon className="h-4 w-4 fill-current text-text" />
          </button>
          <button
            className="flex items-center rounded border border-border p-1.5 hover:bg-contrast"
            onClick={controller.close}
            title={closeShortcut ? `Close (${closeShortcut})` : 'Close'}
            aria-label="Close search"
          >
            <CloseIcon className="h-4 w-4 fill-current text-text" />
          </button>
        </div>
        {controller.isReplaceMode && canReplace && (
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            <input
              type="text"
              placeholder="Replace"
              value={controller.replaceQuery}
              onChange={(event) => {
                controller.setReplaceQuery(event.target.value)
              }}
              onKeyDown={handleReplaceKeyDown}
              className="rounded border border-border bg-default p-1 px-2"
              ref={replaceInputRef}
              disabled={!canReplace}
              aria-label="Replace"
            />
            <Button
              small
              onClick={() => void controller.replaceCurrentResult()}
              disabled={!canReplace || !hasResults || !hasReplaceQuery}
              title="Replace (Enter)"
            >
              Replace
            </Button>
            <Button
              small
              onClick={() => void controller.replaceAllResults()}
              disabled={!canReplace || !hasResults || !hasReplaceQuery}
              title="Replace all (Ctrl + Alt + Enter)"
            >
              Replace all
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2">
            <input
              className="h-4 w-4 rounded accent-info"
              type="checkbox"
              checked={controller.shouldHighlightAll}
              onChange={(event) => controller.setShouldHighlightAll(event.target.checked)}
              disabled={!canHighlightAll}
              aria-label="Highlight all results"
            />
            <div>Highlight all results</div>
          </label>
          {!canHighlightAll && (
            <StyledTooltip
              label="This editor does not support search result highlighting yet."
              className="!z-modal"
              showOnMobile
            >
              <button className="cursor-default" aria-label="Highlight all unavailable">
                <Icon type="info" size="medium" />
              </button>
            </StyledTooltip>
          )}
        </div>
      </div>
    </div>
  )
})
