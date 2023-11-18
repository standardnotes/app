import { ContentType } from '@standardnotes/domain-core'
import {
  ComponentAction,
  ComponentPermission,
  NativeFeatureIdentifier,
  FindNativeFeature,
  UIFeatureDescriptionTypes,
} from '@standardnotes/features'
import { UIFeature } from '@standardnotes/models'
import { RunWithPermissionsUseCase } from './RunWithPermissionsUseCase'
import {
  AlertService,
  ItemManagerInterface,
  MutatorClientInterface,
  SyncServiceInterface,
} from '@standardnotes/services'

const nativeFeatureAsUIFeature = <F extends UIFeatureDescriptionTypes>(identifier: string) => {
  return new UIFeature(FindNativeFeature<F>(identifier)!)
}

describe('RunWithPermissionsUseCase', () => {
  let usecase: RunWithPermissionsUseCase

  beforeEach(() => {
    usecase = new RunWithPermissionsUseCase(
      () => {},
      {} as jest.Mocked<AlertService>,
      {} as jest.Mocked<MutatorClientInterface>,
      {} as jest.Mocked<SyncServiceInterface>,
      {} as jest.Mocked<ItemManagerInterface>,
    )
  })

  describe('permissions', () => {
    it('editor should be able to to stream single note', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamContextItem,
          content_types: [ContentType.TYPES.Note],
        },
      ]

      expect(
        usecase.areRequestedPermissionsValid(
          nativeFeatureAsUIFeature(NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor),
          permissions,
        ),
      ).toEqual(true)
    })

    it('no extension should be able to stream multiple notes', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.TYPES.Note],
        },
      ]

      expect(
        usecase.areRequestedPermissionsValid(
          nativeFeatureAsUIFeature(NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor),
          permissions,
        ),
      ).toEqual(false)
    })

    it('no extension should be able to stream multiple tags', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.TYPES.Tag],
        },
      ]

      expect(
        usecase.areRequestedPermissionsValid(
          nativeFeatureAsUIFeature(NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor),
          permissions,
        ),
      ).toEqual(false)
    })

    it('no extension should be able to stream multiple notes or tags', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.TYPES.Tag, ContentType.TYPES.Note],
        },
      ]

      expect(
        usecase.areRequestedPermissionsValid(
          nativeFeatureAsUIFeature(NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor),
          permissions,
        ),
      ).toEqual(false)
    })

    it('some valid and some invalid permissions should still return invalid permissions', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.TYPES.Tag, ContentType.TYPES.FilesafeFileMetadata],
        },
      ]

      expect(
        usecase.areRequestedPermissionsValid(
          nativeFeatureAsUIFeature(NativeFeatureIdentifier.TYPES.DeprecatedFileSafe),
          permissions,
        ),
      ).toEqual(false)
    })

    it('filesafe should be able to stream its files', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [
            ContentType.TYPES.FilesafeFileMetadata,
            ContentType.TYPES.FilesafeCredentials,
            ContentType.TYPES.FilesafeIntegration,
          ],
        },
      ]

      expect(
        usecase.areRequestedPermissionsValid(
          nativeFeatureAsUIFeature(NativeFeatureIdentifier.TYPES.DeprecatedFileSafe),
          permissions,
        ),
      ).toEqual(true)
    })

    it('bold editor should be able to stream filesafe files', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [
            ContentType.TYPES.FilesafeFileMetadata,
            ContentType.TYPES.FilesafeCredentials,
            ContentType.TYPES.FilesafeIntegration,
          ],
        },
      ]

      expect(
        usecase.areRequestedPermissionsValid(
          nativeFeatureAsUIFeature(NativeFeatureIdentifier.TYPES.DeprecatedBoldEditor),
          permissions,
        ),
      ).toEqual(true)
    })

    it('non bold editor should not able to stream filesafe files', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [
            ContentType.TYPES.FilesafeFileMetadata,
            ContentType.TYPES.FilesafeCredentials,
            ContentType.TYPES.FilesafeIntegration,
          ],
        },
      ]

      expect(
        usecase.areRequestedPermissionsValid(
          nativeFeatureAsUIFeature(NativeFeatureIdentifier.TYPES.DeprecatedPlusEditor),
          permissions,
        ),
      ).toEqual(false)
    })
  })
})
