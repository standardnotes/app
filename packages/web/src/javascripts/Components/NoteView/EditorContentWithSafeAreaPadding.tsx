import { ElementIds } from '@/Constants/ElementIDs'
import { classNames, EditorLineWidth } from '@standardnotes/snjs'
import { CSSProperties, ForwardedRef, forwardRef, ReactNode } from 'react'
import { EditorMargins, EditorMaxWidths } from '../EditorWidthSelectionModal/EditorWidths'
import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'

export const EditorContentWithSafeAreaPadding = forwardRef(function EditorContentWithSafeAreaPadding(
  {
    isNoteLocked,
    editorLineWidth,
    children,
  }: {
    isNoteLocked: boolean
    editorLineWidth: EditorLineWidth
    children: NonNullable<ReactNode>
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { hasBottomInset } = useAvailableSafeAreaPadding()

  return (
    <div
      id={ElementIds.EditorContent}
      className={classNames(
        ElementIds.EditorContent,
        'z-editor-content overflow-auto sm:[&>*]:mx-[var(--editor-margin)] sm:[&>*]:max-w-[var(--editor-max-width)]',
        hasBottomInset && isNoteLocked && 'pb-safe-bottom',
      )}
      style={
        {
          '--editor-margin': EditorMargins[editorLineWidth],
          '--editor-max-width': EditorMaxWidths[editorLineWidth],
        } as CSSProperties
      }
      ref={ref}
    >
      {children}
    </div>
  )
})
