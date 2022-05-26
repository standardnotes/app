import { FunctionComponent } from 'react'

type Props = {
  deprecationMessage: string | undefined
  dismissDeprecationMessage: () => void
}

const IsDeprecated: FunctionComponent<Props> = ({ deprecationMessage, dismissDeprecationMessage }) => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-app-bar no-edges no-top-edge dynamic-height'}>
        <div className={'left'}>
          <div className={'sk-app-bar-item'}>
            <div className={'sk-label warning'}>{deprecationMessage || 'This extension is deprecated.'}</div>
          </div>
        </div>
        <div className={'right'}>
          <div className={'sk-app-bar-item'} onClick={dismissDeprecationMessage}>
            <button className={'sn-button small info'}>Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IsDeprecated
