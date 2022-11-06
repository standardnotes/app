import { ComponentAction } from '@standardnotes/snjs'
import { FunctionComponent, useEffect, useMemo } from 'react'
import ComponentView from '../../ComponentView/ComponentView'
import { LoggingDomain, log } from '@/Logging'
import { UnmanagedBlockComponentInterface } from './BlockComponentInterface'

export const ComponentBlock: FunctionComponent<UnmanagedBlockComponentInterface> = ({
  block,
  note,
  application,
  onSizeChange,
}) => {
  const componentIdentifier = block.componentIdentifier
  if (!componentIdentifier) {
    throw new Error('Attempting to render ComponentBlock without componentIdentifier')
  }

  const component = useMemo(
    () => application.componentManager.componentWithIdentifier(componentIdentifier),
    [application, componentIdentifier],
  )

  const viewer = useMemo(
    () => component && application.componentManager.createBlockComponentViewer(component, note.uuid, block.id),
    [application, component, note.uuid, block.id],
  )

  useEffect(() => {
    const disposer = viewer?.addActionObserver((action, data) => {
      if (action === ComponentAction.SetSize) {
        if (data.height && data.height > 0) {
          log(LoggingDomain.BlockEditor, `Received block height ${data.height}`)
          onSizeChange?.({ width: 0, height: Number(data.height) })
        }
      }
    })

    return disposer
  }, [viewer, block, onSizeChange])

  useEffect(() => {
    return () => {
      if (viewer) {
        application.componentManager.destroyComponentViewer(viewer)
      }
    }
  }, [application, viewer])

  if (!component || !viewer) {
    return <div>Unable to find component {block.componentIdentifier}</div>
  }

  return <ComponentView key={viewer.identifier} componentViewer={viewer} application={application} />
}
