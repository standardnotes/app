import {
  ComponentAction,
  ComponentFeatureDescription,
  ComponentPermission,
  FindNativeFeature,
} from '@standardnotes/features'
import { ComponentInterface, ComponentMutator, PermissionDialog, UIFeature } from '@standardnotes/models'
import {
  AlertService,
  ItemManagerInterface,
  MutatorClientInterface,
  SyncServiceInterface,
} from '@standardnotes/services'
import { AllowedBatchContentTypes, AllowedBatchStreaming } from '../Types'
import { Copy, filterFromArray, removeFromArray, uniqueArray } from '@standardnotes/utils'
import { permissionsStringForPermissions } from '../permissionsStringForPermissions'

export class RunWithPermissionsUseCase {
  private permissionDialogs: PermissionDialog[] = []
  private pendingErrorAlerts: Set<string> = new Set()

  constructor(
    private permissionDialogUIHandler: (dialog: PermissionDialog) => void,
    private alerts: AlertService,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
  ) {}

  deinit() {
    this.permissionDialogs = []
    ;(this.permissionDialogUIHandler as unknown) = undefined
    ;(this.alerts as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.items as unknown) = undefined
  }

  public execute(
    componentIdentifier: string,
    requiredPermissions: ComponentPermission[],
    runFunction: () => void,
  ): void {
    const uiFeature = this.findUIFeature(componentIdentifier)

    if (!uiFeature) {
      if (!this.pendingErrorAlerts.has(componentIdentifier)) {
        this.pendingErrorAlerts.add(componentIdentifier)
        void this.alerts
          .alert(
            `Unable to find component with ID ${componentIdentifier}. Please restart the app and try again.`,
            'An unexpected error occurred',
          )
          .then(() => {
            this.pendingErrorAlerts.delete(componentIdentifier)
          })
      }

      return
    }

    if (uiFeature.isNativeFeature) {
      runFunction()
      return
    }

    if (!this.areRequestedPermissionsValid(uiFeature, requiredPermissions)) {
      console.error('Component is requesting invalid permissions', componentIdentifier, requiredPermissions)
      return
    }

    const acquiredPermissions = uiFeature.acquiredPermissions

    /* Make copy as not to mutate input values */
    requiredPermissions = Copy<ComponentPermission[]>(requiredPermissions)
    for (const required of requiredPermissions.slice()) {
      /* Remove anything we already have */
      const respectiveAcquired = acquiredPermissions.find((candidate) => candidate.name === required.name)
      if (!respectiveAcquired) {
        continue
      }
      /* We now match on name, lets substract from required.content_types anything we have in acquired. */
      const requiredContentTypes = required.content_types
      if (!requiredContentTypes) {
        /* If this permission does not require any content types (i.e stream-context-item)
          then we can remove this from required since we match by name (respectiveAcquired.name === required.name) */
        filterFromArray(requiredPermissions, required)
        continue
      }
      for (const acquiredContentType of respectiveAcquired.content_types as string[]) {
        removeFromArray(requiredContentTypes, acquiredContentType)
      }
      if (requiredContentTypes.length === 0) {
        /* We've removed all acquired and end up with zero, means we already have all these permissions */
        filterFromArray(requiredPermissions, required)
      }
    }
    if (requiredPermissions.length > 0) {
      this.promptForPermissionsWithDeferredRendering(
        uiFeature.asComponent,
        requiredPermissions,
        // eslint-disable-next-line @typescript-eslint/require-await
        async (approved) => {
          if (approved) {
            runFunction()
          }
        },
      )
    } else {
      runFunction()
    }
  }

  setPermissionDialogUIHandler(handler: (dialog: PermissionDialog) => void): void {
    this.permissionDialogUIHandler = handler
  }

  areRequestedPermissionsValid(
    uiFeature: UIFeature<ComponentFeatureDescription>,
    permissions: ComponentPermission[],
  ): boolean {
    for (const permission of permissions) {
      if (permission.name === ComponentAction.StreamItems) {
        if (!AllowedBatchStreaming.includes(uiFeature.featureIdentifier)) {
          return false
        }
        const hasNonAllowedBatchPermission = permission.content_types?.some(
          (type) => !AllowedBatchContentTypes.includes(type),
        )
        if (hasNonAllowedBatchPermission) {
          return false
        }
      }
    }

    return true
  }

  private promptForPermissionsWithDeferredRendering(
    component: ComponentInterface,
    permissions: ComponentPermission[],
    callback: (approved: boolean) => Promise<void>,
  ): void {
    setTimeout(() => {
      this.promptForPermissions(component, permissions, callback)
    })
  }

  private promptForPermissions(
    component: ComponentInterface,
    permissions: ComponentPermission[],
    callback: (approved: boolean) => Promise<void>,
  ): void {
    const params: PermissionDialog = {
      component: component,
      permissions: permissions,
      permissionsString: permissionsStringForPermissions(permissions, component),
      actionBlock: callback,
      callback: async (approved: boolean) => {
        const latestComponent = this.items.findItem<ComponentInterface>(component.uuid)

        if (!latestComponent) {
          return
        }

        if (approved) {
          const componentPermissions = Copy(latestComponent.permissions) as ComponentPermission[]
          for (const permission of permissions) {
            const matchingPermission = componentPermissions.find((candidate) => candidate.name === permission.name)
            if (!matchingPermission) {
              componentPermissions.push(permission)
            } else {
              /* Permission already exists, but content_types may have been expanded */
              const contentTypes = matchingPermission.content_types || []
              matchingPermission.content_types = uniqueArray(contentTypes.concat(permission.content_types as string[]))
            }
          }

          await this.mutator.changeItem(component, (m) => {
            const mutator = m as ComponentMutator
            mutator.permissions = componentPermissions
          })

          void this.sync.sync()
        }

        this.permissionDialogs = this.permissionDialogs.filter((pendingDialog) => {
          /* Remove self */
          if (pendingDialog === params) {
            pendingDialog.actionBlock && pendingDialog.actionBlock(approved)
            return false
          }
          const containsObjectSubset = (source: ComponentPermission[], target: ComponentPermission[]) => {
            return !target.some((val) => !source.find((candidate) => JSON.stringify(candidate) === JSON.stringify(val)))
          }
          if (pendingDialog.component === component) {
            /* remove pending dialogs that are encapsulated by already approved permissions, and run its function */
            if (
              pendingDialog.permissions === permissions ||
              containsObjectSubset(permissions, pendingDialog.permissions)
            ) {
              /* If approved, run the action block. Otherwise, if canceled, cancel any
              pending ones as well, since the user was explicit in their intentions */
              if (approved) {
                pendingDialog.actionBlock && pendingDialog.actionBlock(approved)
              }
              return false
            }
          }
          return true
        })

        if (this.permissionDialogs.length > 0) {
          this.permissionDialogUIHandler(this.permissionDialogs[0])
        }
      },
    }
    /**
     * Since these calls are asyncronous, multiple dialogs may be requested at the same time.
     * We only want to present one and trigger all callbacks based on one modal result
     */
    const existingDialog = this.permissionDialogs.find((dialog) => dialog.component === component)
    this.permissionDialogs.push(params)
    if (!existingDialog) {
      this.permissionDialogUIHandler(params)
    }
  }

  private findUIFeature(identifier: string): UIFeature<ComponentFeatureDescription> | undefined {
    const nativeFeature = FindNativeFeature<ComponentFeatureDescription>(identifier)
    if (nativeFeature) {
      return new UIFeature(nativeFeature)
    }

    const componentItem = this.items.findItem<ComponentInterface>(identifier)
    if (componentItem) {
      return new UIFeature<ComponentFeatureDescription>(componentItem)
    }

    return undefined
  }
}
