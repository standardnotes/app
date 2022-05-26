import { FunctionComponent } from 'react'

type Props = {
  componentName: string
}

const UrlMissing: FunctionComponent<Props> = ({ componentName }) => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-panel static'}>
        <div className={'sk-panel-content'}>
          <div className={'sk-panel-section stretch'}>
            <div className={'sk-panel-section-title'}>This extension is missing its URL property.</div>
            <p>In order to access your note immediately, please switch from {componentName} to the Plain Editor.</p>
            <br />
            <p>Please contact help@standardnotes.com to remedy this issue.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UrlMissing
