import { NoteType, SNNote, classNames } from '@standardnotes/snjs'
import { useEffect, useState } from 'react'
import fastdiff from 'fast-diff'
import { HeadlessSuperConverter } from '../../SuperEditor/Tools/HeadlessSuperConverter'

export const DiffView = ({
  selectedNotes,
  convertSuperToMarkdown,
}: {
  selectedNotes: SNNote[]
  convertSuperToMarkdown: boolean
}) => {
  const [results, setResults] = useState<fastdiff.Diff[]>([])

  useEffect(() => {
    const firstNote = selectedNotes[0]
    const first =
      firstNote.noteType === NoteType.Super && convertSuperToMarkdown
        ? new HeadlessSuperConverter().convertString(firstNote.text, 'md')
        : firstNote.text
    const secondNote = selectedNotes[1]
    const second =
      secondNote.noteType === NoteType.Super && convertSuperToMarkdown
        ? new HeadlessSuperConverter().convertString(secondNote.text, 'md')
        : secondNote.text

    const results = fastdiff(first, second, undefined, true)

    setResults(results)
  }, [convertSuperToMarkdown, selectedNotes])

  const [preElement, setPreElement] = useState<HTMLPreElement | null>(null)
  const [diffVisualizer, setDiffVisualizer] = useState<HTMLDivElement | null>(null)
  const [hasOverflow, setHasOverflow] = useState(false)

  useEffect(() => {
    if (!preElement) {
      return
    }

    setHasOverflow(preElement.scrollHeight > preElement.clientHeight)
  }, [preElement, results])

  useEffect(() => {
    if (!preElement || !diffVisualizer) {
      return
    }

    if (!hasOverflow) {
      return
    }

    if (!results.length) {
      return
    }

    diffVisualizer.innerHTML = ''
    const preElementRect = preElement.getBoundingClientRect()
    const diffVisualizerRect = diffVisualizer.getBoundingClientRect()

    const diffs = preElement.querySelectorAll('[data-diff]')

    diffs.forEach((diff) => {
      const state = diff.getAttribute('data-diff')
      if (!state) {
        return
      }
      const parsedState = parseInt(state)

      const rect = diff.getBoundingClientRect()

      const topAsPercent = (rect.top - preElementRect.top) / preElement.scrollHeight
      const topAdjustedForDiffVisualizer = diffVisualizerRect.height * topAsPercent

      const heightAsPercent = rect.height / preElement.scrollHeight
      const heightAdjustedForDiffVisualizer = diffVisualizerRect.height * heightAsPercent

      const div = document.createElement('div')
      div.className = `absolute top-0 left-0 w-full bg-${
        parsedState === fastdiff.INSERT ? 'success' : 'danger'
      } opacity-50`
      div.style.height = `${heightAdjustedForDiffVisualizer}px`
      div.style.top = `${topAdjustedForDiffVisualizer}px`

      diffVisualizer.appendChild(div)
    })
  }, [preElement, hasOverflow, results, diffVisualizer])

  return (
    <div className="relative flex-grow overflow-hidden">
      <pre
        className="h-full w-full overflow-y-auto whitespace-pre-wrap p-4 [&::-webkit-scrollbar]:bg-transparent"
        ref={setPreElement}
      >
        {results.map(([state, text], index) => {
          return (
            <span
              data-diff={state !== fastdiff.EQUAL ? state : undefined}
              className={classNames(
                'whitespace-pre-wrap',
                state === fastdiff.INSERT && 'bg-success text-success-contrast',
                state === fastdiff.DELETE && 'bg-danger text-danger-contrast',
              )}
              key={index}
            >
              {text}
            </span>
          )
        })}
      </pre>
      {hasOverflow && (
        <div className="absolute top-0 right-0 z-[-1] h-full w-[19px] border-l border-border" ref={setDiffVisualizer} />
      )}
    </div>
  )
}
