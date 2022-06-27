import { FunctionComponent } from 'react'
import Button from '@/Components/Button/Button'

type Props = {
  deprecationMessage: string | undefined
  dismissDeprecationMessage: () => void
}

const IsDeprecated: FunctionComponent<Props> = ({ deprecationMessage, dismissDeprecationMessage }) => {
  return (
    <div className={'sn-component'}>
      <div className="flex justify-between items-center w-full min-h-[1.625rem] py-2.5 px-2 bg-contrast text-text border-b border-border select-none">
        <div className={'left'}>
          <div className={'sk-app-bar-item'}>
            <div className="font-bold text-xs text-warning">
              {deprecationMessage || 'This extension is deprecated.'}
            </div>
          </div>
        </div>
        <div className={'right'}>
          <Button primary onClick={dismissDeprecationMessage} small>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}

export default IsDeprecated
