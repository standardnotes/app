import { FunctionComponent } from 'react'
import Button from '@/Components/Button/Button'

type Props = {
  componentName: string
  reloadIframe: () => void
}

const IssueOnLoading: FunctionComponent<Props> = ({ componentName, reloadIframe }) => {
  return (
    <div className={'sn-component'}>
      <div className="flex min-h-[1.625rem] w-full select-none items-center justify-between border-b border-border bg-contrast py-2.5 px-2 text-text">
        <div className={'left'}>
          <div className={'sk-app-bar-item'}>
            <div className={'sk-label.warning'}>There was an issue loading {componentName}.</div>
          </div>
        </div>
        <div className={'right'}>
          <Button primary onClick={reloadIframe} small>
            Reload
          </Button>
        </div>
      </div>
    </div>
  )
}

export default IssueOnLoading
