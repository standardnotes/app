import { FunctionComponent } from 'react'
import Button from '@/Components/Button/Button'

type Props = {
  componentName: string
  reloadIframe: () => void
}

const IssueOnLoading: FunctionComponent<Props> = ({ componentName, reloadIframe }) => {
  return (
    <div className={'sn-component'}>
      <div className="flex justify-between items-center w-full min-h-[1.625rem] py-2.5 px-2 bg-contrast text-text border-b border-border select-none">
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
