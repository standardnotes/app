import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import ProtectedItemOverlay from '@/Components/ProtectedItemOverlay/ProtectedItemOverlay'
import FileViewWithoutProtection from './FileViewWithoutProtection'
import { FileViewProps } from './FileViewProps'

const FileView = ({ application, viewControllerManager, file }: FileViewProps) => {
  const [shouldShowProtectedOverlay, setShouldShowProtectedOverlay] = useState(
    file.protected && !application.hasProtectionSources(),
  )

  useEffect(() => {
    setShouldShowProtectedOverlay(viewControllerManager.filesController.showProtectedOverlay)
  }, [viewControllerManager.filesController.showProtectedOverlay])

  const dismissProtectedWarning = useCallback(() => {
    void viewControllerManager.filesController.toggleFileProtection(file)
  }, [file, viewControllerManager.filesController])

  return shouldShowProtectedOverlay ? (
    <div aria-label="Note" className="section editor sn-component">
      <div className="h-full flex justify-center items-center">
        <ProtectedItemOverlay
          viewControllerManager={viewControllerManager}
          hasProtectionSources={application.hasProtectionSources()}
          onViewItem={dismissProtectedWarning}
          itemType={'note'}
        />
      </div>
    </div>
  ) : (
    <FileViewWithoutProtection application={application} viewControllerManager={viewControllerManager} file={file} />
  )
}

export default observer(FileView)
