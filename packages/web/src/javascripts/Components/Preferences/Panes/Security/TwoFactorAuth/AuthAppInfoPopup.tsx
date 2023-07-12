import Icon from '@/Components/Icon/Icon'
import { Hovercard, HovercardAnchor, useHovercardStore } from '@ariakit/react'

const AuthAppInfoTooltip = () => {
  const infoHovercard = useHovercardStore({
    showTimeout: 100,
  })

  return (
    <>
      <HovercardAnchor store={infoHovercard}>
        <Icon type="info" />
      </HovercardAnchor>
      <Hovercard store={infoHovercard} className=" max-w-76 rounded border border-border bg-default px-3 py-2 text-sm">
        Some apps, like Google Authenticator, do not back up and restore your secret keys if you lose your device or get
        a new one.
      </Hovercard>
    </>
  )
}

export default AuthAppInfoTooltip
