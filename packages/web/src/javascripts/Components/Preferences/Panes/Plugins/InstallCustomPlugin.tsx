import Button from '@/Components/Button/Button'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { FunctionComponent, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import ConfirmCustomPlugin from './ConfirmCustomPlugin'
import { AnyPackageType } from './AnyPackageType'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'

type Props = {
  className?: string
}

const InstallCustomPlugin: FunctionComponent<Props> = ({ className = '' }) => {
  const application = useApplication()

  const [customUrl, setCustomUrl] = useState('')
  const [confirmableExtension, setConfirmableExtension] = useState<AnyPackageType | undefined>(undefined)

  const confirmableEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (confirmableExtension) {
      confirmableEnd.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [confirmableExtension, confirmableEnd])

  const submitExtensionUrl = async (url: string) => {
    const component = await application.pluginsService.installPluginFromUrl(url)
    if (component) {
      setConfirmableExtension(component)
    }
  }

  const handleConfirmExtensionSubmit = async (confirm: boolean) => {
    if (confirm) {
      confirmExtension().catch(console.error)
    }
    setConfirmableExtension(undefined)
    setCustomUrl('')
  }

  const confirmExtension = async () => {
    await application.mutator.insertItem(confirmableExtension as AnyPackageType)
    application.sync.sync().catch(console.error)
  }

  return (
    <div className={className}>
      <div>
        {!confirmableExtension && (
          <PreferencesSegment>
            <div>
              <DecoratedInput
                placeholder={'Enter Plugin URL'}
                value={customUrl}
                onChange={(value) => {
                  setCustomUrl(value)
                }}
              />
            </div>
            <Button
              hidden={customUrl.length === 0}
              disabled={customUrl.length === 0}
              className="mt-4 min-w-20"
              primary
              label="Install"
              onClick={() => submitExtensionUrl(customUrl)}
            />
          </PreferencesSegment>
        )}
        {confirmableExtension && (
          <PreferencesSegment>
            <ConfirmCustomPlugin component={confirmableExtension} callback={handleConfirmExtensionSubmit} />
            <div ref={confirmableEnd} />
          </PreferencesSegment>
        )}
      </div>
    </div>
  )
}

export default observer(InstallCustomPlugin)
