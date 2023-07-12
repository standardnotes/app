import { FunctionComponent } from 'react'
import Button from '@/Components/Button/Button'

type Props = {
  deprecationMessage: string | undefined
  dismissDeprecationMessage: () => void
}

const IsDeprecated: FunctionComponent<Props> = ({ deprecationMessage, dismissDeprecationMessage }) => {
  return (
    <div className={'sn-component'}>
      <div className="flex min-h-[1.625rem] w-full select-none items-center justify-between border-b border-border bg-contrast px-2 py-2.5 text-text">
        <div className={'left'}>
          <div className={'sk-app-bar-item'}>
            <div className="text-xs font-bold text-warning">
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
