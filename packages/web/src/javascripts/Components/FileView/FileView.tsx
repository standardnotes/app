import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import ProtectedItemOverlay from '@/Components/ProtectedItemOverlay/ProtectedItemOverlay'
import FileViewWithoutProtection from './FileViewWithoutProtection'
import { FileViewProps } from './FileViewProps'

const FileView = ({ application, viewControllerManager, file }: FileViewProps) => {
  const [shouldShowProtectedOverlay, setShouldShowProtectedOverlay] = useState(false)

  useEffect(() => {
    viewControllerManager.filesController.setShowProtectedOverlay(file.protected && !application.hasProtectionSources())
  }, [application, file.protected, viewControllerManager.filesController])

  useEffect(() => {
    setShouldShowProtectedOverlay(viewControllerManager.filesController.showProtectedOverlay)
  }, [viewControllerManager.filesController.showProtectedOverlay])

  const dismissProtectedOverlay = useCallback(async () => {
    let showFileContents = true

    if (application.hasProtectionSources()) {
      showFileContents = await application.protections.authorizeItemAccess(file)
    }

    if (showFileContents) {
      setShouldShowProtectedOverlay(false)
    }
  }, [application, file])

  return shouldShowProtectedOverlay ? (
    <ProtectedItemOverlay
      viewControllerManager={viewControllerManager}
      hasProtectionSources={application.hasProtectionSources()}
      onViewItem={dismissProtectedOverlay}
      itemType={'file'}
    />
  ) : (
    <FileViewWithoutProtection application={application} viewControllerManager={viewControllerManager} file={file} />
  )
}

export default observer(FileView)
