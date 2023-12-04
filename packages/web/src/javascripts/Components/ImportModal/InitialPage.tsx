import { ImportModalController } from '@/Components/ImportModal/ImportModalController'
import { observer } from 'mobx-react-lite'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import { useApplication } from '../ApplicationProvider'
import { FeatureName } from '@/Controllers/FeatureName'
import { NativeFeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'

type Props = {
  setFiles: ImportModalController['setFiles']
  selectFiles: (service?: string) => Promise<void>
}

const ImportModalInitialPage = ({ setFiles, selectFiles }: Props) => {
  const application = useApplication()

  return (
    <>
      <button
        onClick={() => selectFiles()}
        className="flex min-h-[30vh] w-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-info p-2 hover:border-4"
        onDragStart={(e) => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const files = Array.from(e.dataTransfer.files)
          setFiles(files)
        }}
      >
        <div className="text-lg font-semibold">Drag and drop files to auto-detect and import</div>
        <div className="text-sm">Or click to open file picker</div>
      </button>
      <div className="my-4 w-full text-center">or import from:</div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button className="flex items-center !py-2" onClick={() => selectFiles('evernote')}>
          <Icon type="evernote" className="mr-2 text-[#14cc45]" />
          Evernote
        </Button>
        <Button className="flex items-center !py-2" onClick={() => selectFiles('google-keep')}>
          <Icon type="gkeep" className="mr-2 text-[#fbbd00]" />
          Google Keep
        </Button>
        <Button className="flex items-center !py-2" onClick={() => selectFiles('simplenote')}>
          <Icon type="simplenote" className="mr-2 text-[#3360cc]" />
          Simplenote
        </Button>
        <Button className="flex items-center !py-2" onClick={() => selectFiles('aegis')}>
          <Icon type="aegis" className="mr-2 rounded bg-[#0d47a1] p-1 text-[#fff]" size="normal" />
          Aegis
        </Button>
        <Button className="flex items-center !py-2" onClick={() => selectFiles('plaintext')}>
          <Icon type="plain-text" className="mr-2 text-info" />
          Plaintext / Markdown
        </Button>
        <Button className="flex items-center !py-2" onClick={() => selectFiles('html')}>
          <Icon type="rich-text" className="mr-2 text-accessory-tint-2" />
          HTML
        </Button>
        <Button
          className="flex items-center !py-2"
          onClick={() => {
            const isEntitledToSuper =
              application.features.getFeatureStatus(
                NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SuperEditor).getValue(),
              ) === FeatureStatus.Entitled
            if (!isEntitledToSuper) {
              application.showPremiumModal(FeatureName.Super)
              return
            }
            selectFiles('super').catch(console.error)
          }}
        >
          <Icon type="file-doc" className="mr-2 text-accessory-tint-1" />
          Super (JSON)
        </Button>
      </div>
    </>
  )
}

export default observer(ImportModalInitialPage)
