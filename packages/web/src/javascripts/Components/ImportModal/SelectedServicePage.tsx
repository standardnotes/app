import {
  AegisToAuthenticatorConverter,
  EvernoteConverter,
  GoogleKeepConverter,
  SimplenoteConverter,
} from '@standardnotes/ui-services'
import { Importer } from '@standardnotes/ui-services/src/Import/Importer'
import { Dispatch, useEffect, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import Spinner from '../Spinner/Spinner'
import { ImportModalAction, ImportModalAvailableServices, ImportModalFile } from './Types'

type Props = {
  files: ImportModalFile[]
  selectedService: ImportModalAvailableServices
  dispatch: Dispatch<ImportModalAction>
}

const ServiceConverterClass = {
  evernote: EvernoteConverter,
  simplenote: SimplenoteConverter,
  'google-keep': GoogleKeepConverter,
  aegis: AegisToAuthenticatorConverter,
} as const

const ImportModalSelectedServiceFile = ({
  file,
  serviceConverter,
  dispatch,
}: {
  file: ImportModalFile
  serviceConverter: Importer
  dispatch: Dispatch<ImportModalAction>
}) => {
  useEffect(() => {
    const importFile = async () => {
      try {
        const payloads =
          serviceConverter instanceof EvernoteConverter
            ? await serviceConverter.convertENEXFileToNotesAndTags(file.file, false)
            : serviceConverter instanceof SimplenoteConverter
            ? await serviceConverter.convertSimplenoteBackupFileToNotes(file.file)
            : serviceConverter instanceof GoogleKeepConverter
            ? [await serviceConverter.convertGoogleKeepBackupFileToNote(file.file, false)]
            : serviceConverter instanceof AegisToAuthenticatorConverter
            ? [await serviceConverter.convertAegisBackupFileToNote(file.file, false)]
            : null
        if (!payloads) {
          throw new Error('Could not parse file')
        }
        dispatch({
          type: 'updateFile',
          file: {
            ...file,
            status: 'success',
            payloads,
          },
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : typeof error === 'string' ? error : 'Could not parse file'
        dispatch({
          type: 'updateFile',
          file: {
            ...file,
            status: 'error',
            error: new Error(errorMessage),
          },
        })
      }
    }
    if (file.status === 'pending') {
      void importFile()
    }
  }, [file, serviceConverter, dispatch])

  return (
    <div className="flex items-center justify-between py-2 px-2" key={file.file.name}>
      <div className="flex flex-col">
        <div>{file.file.name}</div>
        <div className="text-xs opacity-75">
          {file.status === 'pending' ? 'Parsing...' : file.status === 'success' ? 'Ready to import' : 'Could not parse'}
        </div>
      </div>
      {file.status === 'pending' ? (
        <Spinner className="h-4 w-4" />
      ) : file.status === 'success' ? (
        <Icon type="check" className="text-success" />
      ) : (
        <Icon type="warning" className="text-danger" />
      )}
    </div>
  )
}

const ImportModalSelectedServicePage = ({ files, selectedService, dispatch }: Props) => {
  const application = useApplication()
  const [serviceConverter, setServiceConverter] = useState(
    () => new ServiceConverterClass[selectedService](application),
  )

  useEffect(() => {
    setServiceConverter(new ServiceConverterClass[selectedService](application))
  }, [application, selectedService])

  return (
    <>
      <div className="mb-2 text-base font-semibold">Import from {selectedService}</div>
      <div className="divide-y divide-border">
        {files.map((file) => (
          <ImportModalSelectedServiceFile
            file={file}
            dispatch={dispatch}
            serviceConverter={serviceConverter}
            key={file.file.name}
          />
        ))}
      </div>
    </>
  )
}

export default ImportModalSelectedServicePage
