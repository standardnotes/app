import { BlocksEditor } from '@/Components/SuperEditor/BlocksEditor'
import { BlocksEditorComposer } from '@/Components/SuperEditor/BlocksEditorComposer'
import BlockPickerMenuPlugin from '@/Components/SuperEditor/Plugins/BlockPickerPlugin/BlockPickerPlugin'
import usePreference from '@/Hooks/usePreference'
import { useResponsiveEditorFontSize } from '@/Utils/getPlaintextFontSize'
import { EditorLineHeightValues, PrefKey } from '@standardnotes/snjs'
import { CSSProperties, useRef } from 'react'
import { SuperDemoInitialValue } from './SuperDemoInitialValue'
import { UpgradePrompt } from './UpgradePrompt'
import { useApplication } from '@/Components/ApplicationProvider'

const SuperDemo = ({ hasSubscription }: { hasSubscription: boolean }) => {
  const application = useApplication()

  const lineHeight = usePreference(PrefKey.EditorLineHeight)
  const fontSize = usePreference(PrefKey.EditorFontSize)
  const responsiveFontSize = useResponsiveEditorFontSize(fontSize, false)

  const ctaRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-border p-4">
        <UpgradePrompt
          featureName="Super notes"
          ctaRef={ctaRef}
          application={application}
          hasSubscription={hasSubscription}
          inline
          preferHorizontalLayout
        />
      </div>
      <div
        className="relative flex h-full min-h-0 flex-col"
        style={
          {
            '--line-height': EditorLineHeightValues[lineHeight],
            '--font-size': responsiveFontSize,
          } as CSSProperties
        }
      >
        <BlocksEditorComposer initialValue={SuperDemoInitialValue()}>
          <BlocksEditor className="blocks-editor h-full bg-default">
            <BlockPickerMenuPlugin popoverZIndex="z-modal" />
          </BlocksEditor>
        </BlocksEditorComposer>
      </div>
    </div>
  )
}

export default SuperDemo
