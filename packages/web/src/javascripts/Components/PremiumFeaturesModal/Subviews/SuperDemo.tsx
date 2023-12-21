import { BlocksEditor } from '@/Components/SuperEditor/BlocksEditor'
import { BlocksEditorComposer } from '@/Components/SuperEditor/BlocksEditorComposer'
import BlockPickerMenuPlugin from '@/Components/SuperEditor/Plugins/BlockPickerPlugin/BlockPickerPlugin'
import usePreference from '@/Hooks/usePreference'
import { useResponsiveEditorFontSize } from '@/Utils/getPlaintextFontSize'
import { EditorLineHeightValues, PrefKey } from '@standardnotes/snjs'
import { CSSProperties } from 'react'

const SuperDemo = () => {
  const lineHeight = usePreference(PrefKey.EditorLineHeight)
  const fontSize = usePreference(PrefKey.EditorFontSize)
  const responsiveFontSize = useResponsiveEditorFontSize(fontSize, false)

  return (
    <div
      className="relative flex h-full flex-col"
      style={
        {
          '--line-height': EditorLineHeightValues[lineHeight],
          '--font-size': responsiveFontSize,
        } as CSSProperties
      }
    >
      <BlocksEditorComposer initialValue={undefined}>
        <BlocksEditor className="blocks-editor h-full bg-default">
          <BlockPickerMenuPlugin popoverZIndex="z-modal" />
        </BlocksEditor>
      </BlocksEditorComposer>
    </div>
  )
}

export default SuperDemo
