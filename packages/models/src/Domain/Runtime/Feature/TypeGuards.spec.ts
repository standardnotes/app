import {
  AnyFeatureDescription,
  ComponentArea,
  EditorFeatureDescription,
  IframeComponentFeatureDescription,
  NoteType,
  UIFeatureDescriptionTypes,
} from '@standardnotes/features'
import { isUIFeatureAnIframeFeature, isItemBasedFeature, isNativeFeature } from './TypeGuards'
import { UIFeature } from './UIFeature'
import { ComponentInterface } from '../../Syncable/Component'
import { ContentType } from '@standardnotes/domain-core'

describe('TypeGuards', () => {
  describe('isUIFeatureAnIframeFeature', () => {
    it('should return true if feature is IframeUIFeature', () => {
      const x: UIFeature<IframeComponentFeatureDescription> = {
        featureDescription: {
          content_type: ContentType.TYPES.Component,
          area: ComponentArea.Editor,
        },
      } as jest.Mocked<UIFeature<IframeComponentFeatureDescription>>

      expect(isUIFeatureAnIframeFeature(x)).toBe(true)
    })

    it('should return false if feature is not IframeUIFeature', () => {
      const x: UIFeature<EditorFeatureDescription> = {
        featureDescription: {
          note_type: NoteType.Super,
        },
      } as jest.Mocked<UIFeature<EditorFeatureDescription>>

      expect(isUIFeatureAnIframeFeature(x)).toBe(false)
    })
  })

  describe('isFeatureAComponent', () => {
    it('should return true if feature is a Component', () => {
      const x: ComponentInterface | UIFeatureDescriptionTypes = {
        uuid: 'abc-123',
      } as ComponentInterface

      expect(isItemBasedFeature(x)).toBe(true)
    })

    it('should return false if feature description is not a component', () => {
      const x: EditorFeatureDescription = {
        note_type: NoteType.Super,
      } as jest.Mocked<EditorFeatureDescription>

      expect(isItemBasedFeature(x)).toBe(false)
    })
  })

  describe('isNativeFeature', () => {
    it('should return true if x is a feature description', () => {
      const x: AnyFeatureDescription = {
        content_type: 'TestContentType',
      } as AnyFeatureDescription

      expect(isNativeFeature(x)).toBe(true)
    })

    it('should return false if x is a component', () => {
      const x: ComponentInterface = {
        uuid: 'abc-123',
      } as ComponentInterface

      expect(isNativeFeature(x)).toBe(false)
    })
  })
})
