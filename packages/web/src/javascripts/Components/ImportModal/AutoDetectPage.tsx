import { parseFileName } from '@standardnotes/filepicker'
import { classNames } from '@standardnotes/snjs'
import { AegisToAuthenticatorConverter, GoogleKeepConverter, SimplenoteConverter } from '@standardnotes/ui-services'
import { readFileAsText } from '@standardnotes/ui-services/src/Import/Utils'
import { useEffect, useState } from 'react'
import Icon from '../Icon/Icon'
import { ImportModalAvailableServices, ImportModalFile } from './Types'

const detectService = async (file: File): Promise<ImportModalAvailableServices | null> => {
  const content = await readFileAsText(file)

  const { ext } = parseFileName(file.name)

  if (ext === 'enex') {
    return 'evernote'
  }

  try {
    const json = JSON.parse(content)

    if (AegisToAuthenticatorConverter.isValidAegisJson(json)) {
      return 'aegis'
    }

    if (GoogleKeepConverter.isValidGoogleKeepJson(json)) {
      return 'google-keep'
    }

    if (SimplenoteConverter.isValidSimplenoteJson(json)) {
      return 'simplenote'
    }
  } catch {
    return null
  }

  return null
}

const ServiceColors: Record<ImportModalAvailableServices, string> = {
  evernote: 'bg-[#14cc45] text-[#000]',
  simplenote: 'bg-[#3360cc] text-default',
  'google-keep': 'bg-[#fbbd00] text-[#000]',
  aegis: 'bg-[#0d47a1] text-default',
}

const ServiceIcons: Record<ImportModalAvailableServices, string> = {
  evernote: 'evernote',
  simplenote: 'simplenote',
  'google-keep': 'gkeep',
  aegis: 'aegis',
}

const ImportModalAutoDetectFile = ({ file }: { file: ImportModalFile }) => {
  const [detectedService, setDetectedService] = useState<ImportModalAvailableServices | null>()

  useEffect(() => {
    const detect = async () => {
      const detectedService = await detectService(file.file)
      setDetectedService(detectedService)
    }
    if (typeof detectedService === 'undefined') {
      void detect()
    }
  }, [detectedService, file.file])

  return (
    <div className="flex items-center py-2 px-2" key={file.file.name}>
      {detectedService && (
        <div className={classNames('mr-4 rounded p-2', ServiceColors[detectedService])}>
          <Icon type={ServiceIcons[detectedService]} size="medium" />
        </div>
      )}
      <div className="mr-auto flex flex-col">
        <div>{file.file.name}</div>
        <div className="text-xs opacity-75">
          {detectedService
            ? 'Detected service. Ready to parse.'
            : detectedService == null
            ? 'Could not auto-detect service. Please select manually.'
            : 'Detecting service...'}
        </div>
      </div>
      {detectedService == null && (
        <select className="rounded border border-border px-2 py-1">
          <option value="evernote">Evernote</option>
          <option value="simplenote">Simplenote</option>
          <option value="google-keep">Google Keep</option>
          <option value="aegis">Aegis</option>
          <option value="plaintext">Plaintext</option>
        </select>
      )}
    </div>
  )
}

const ImportModalAutoDetectPage = ({ files }: { files: ImportModalFile[] }) => {
  return (
    <div className="divide-y divide-border">
      {files.map((file) => (
        <ImportModalAutoDetectFile file={file} key={file.file.name} />
      ))}
    </div>
  )
}

export default ImportModalAutoDetectPage
