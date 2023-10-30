import { NoteType, SNNote, classNames } from '@standardnotes/snjs'
import { useEffect, useState } from 'react'
import fastdiff from 'fast-diff'
import { HeadlessSuperConverter } from '../../SuperEditor/Tools/HeadlessSuperConverter'

const DiffSpan = ({ state, text }: { state: fastdiff.Diff[0]; text: fastdiff.Diff[1] }) => (
  <span
    data-diff={state !== fastdiff.EQUAL ? state : undefined}
    className={classNames(
      'whitespace-pre-wrap',
      state === fastdiff.INSERT && 'bg-success text-success-contrast',
      state === fastdiff.DELETE && 'bg-danger text-danger-contrast',
    )}
  >
    {text}
  </span>
)

export const DiffView = ({
  selectedNotes,
  convertSuperToMarkdown,
}: {
  selectedNotes: SNNote[]
  convertSuperToMarkdown: boolean
}) => {
  const [titleDiff, setTitleDiff] = useState<fastdiff.Diff[]>([])
  const [textDiff, setTextDiff] = useState<fastdiff.Diff[]>([])

  useEffect(() => {
    const setDiffs = async () => {
      const firstNote = selectedNotes[0]
      const firstTitle = firstNote.title
      const firstText =
        firstNote.noteType === NoteType.Super && convertSuperToMarkdown
          ? await new HeadlessSuperConverter().convertSuperStringToOtherFormat(firstNote.text, 'md')
          : firstNote.text

      const secondNote = selectedNotes[1]
      const secondTitle = secondNote.title
      const secondText =
        secondNote.noteType === NoteType.Super && convertSuperToMarkdown
          ? await new HeadlessSuperConverter().convertSuperStringToOtherFormat(secondNote.text, 'md')
          : secondNote.text

      const titleDiff = fastdiff(firstTitle, secondTitle, undefined, true)
      const textDiff = fastdiff(firstText, secondText, undefined, true)

      setTitleDiff(titleDiff)
      setTextDiff(textDiff)
    }

    setDiffs().catch(console.error)
  }, [convertSuperToMarkdown, selectedNotes])

  const [preElement, setPreElement] = useState<HTMLPreElement | null>(null)
  const [diffVisualizer, setDiffVisualizer] = useState<HTMLDivElement | null>(null)
  const [hasOverflow, setHasOverflow] = useState(false)

  useEffect(() => {
    if (!preElement) {
      return
    }

    setHasOverflow(preElement.scrollHeight > preElement.clientHeight)
  }, [preElement, textDiff])

  useEffect(() => {
    if (!preElement || !diffVisualizer) {
      return
    }

    if (!hasOverflow) {
      return
    }

    if (!textDiff.length) {
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
  }, [preElement, hasOverflow, textDiff, diffVisualizer])

  return (
    <div className="force-custom-scrollbar relative flex flex-grow flex-col overflow-hidden">
      <div className="w-full px-4 py-4 text-base font-bold">
        {titleDiff.map(([state, text], index) => (
          <DiffSpan state={state} text={text} key={index} />
        ))}
      </div>
      <pre
        className="font-editor min-h-0 w-full flex-grow overflow-y-auto whitespace-pre-wrap p-4 pt-0 text-editor [&::-webkit-scrollbar]:bg-transparent"
        ref={setPreElement}
      >
        {textDiff.map(([state, text], index) => (
          <DiffSpan state={state} text={text} key={index} />
        ))}
      </pre>
      {hasOverflow && (
        <div className="absolute right-0 top-0 z-[-1] h-full w-[19px] border-l border-border" ref={setDiffVisualizer} />
      )}
    </div>
  )
}
