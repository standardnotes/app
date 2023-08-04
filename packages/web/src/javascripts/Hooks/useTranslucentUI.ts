import { useApplication } from '@/Components/ApplicationProvider'
import { PrefKey, PrefDefaults } from '@standardnotes/snjs'
import { useEffect, useState } from 'react'
import Color from 'color'

const BackgroundCSSVariable = '--sn-stylekit-background-color'

const getLatestBackgroundColor = () => getComputedStyle(document.body).getPropertyValue(BackgroundCSSVariable)

export const useTranslucentUI = (): React.CSSProperties => {
  const application = useApplication()
  const canUseTranslucentUI = application.getPreference(
    PrefKey.UseTranslucentUI,
    PrefDefaults[PrefKey.UseTranslucentUI],
  )
  const [color, setColor] = useState(() => Color(getLatestBackgroundColor()).alpha(0.65))

  const backgroundColor = getLatestBackgroundColor()

  useEffect(() => {
    setColor(Color(backgroundColor).alpha(0.65))
  }, [backgroundColor])

  const translucentBackdropFilter = color.isDark()
    ? 'blur(12px) saturate(190%) contrast(70%) brightness(80%)'
    : 'blur(12px) saturate(190%) contrast(50%) brightness(130%)'

  return {
    backgroundColor: canUseTranslucentUI ? color.toString() : `var(${BackgroundCSSVariable})`,
    backdropFilter: canUseTranslucentUI ? translucentBackdropFilter : undefined,
  }
}
