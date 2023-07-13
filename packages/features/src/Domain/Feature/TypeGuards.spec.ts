import { ContentType } from '@standardnotes/domain-core'
import { AnyFeatureDescription } from './AnyFeatureDescription'
import { ComponentArea } from '../Component/ComponentArea'

import {
  isThemeFeatureDescription,
  isIframeComponentFeatureDescription,
  isEditorFeatureDescription,
} from './TypeGuards'
import { ThemeFeatureDescription } from './ThemeFeatureDescription'
import { IframeComponentFeatureDescription } from './IframeComponentFeatureDescription'

describe('TypeGuards', () => {
  describe('isThemeFeatureDescription', () => {
    it('should return true if feature is ThemeFeatureDescription', () => {
      const feature = {
        content_type: ContentType.TYPES.Theme,
      } as jest.Mocked<ThemeFeatureDescription>
      expect(isThemeFeatureDescription(feature)).toBe(true)
    })

    it('should return false if feature is not ThemeFeatureDescription', () => {
      const feature = {
        content_type: ContentType.TYPES.Component,
      } as jest.Mocked<ThemeFeatureDescription>
      expect(isThemeFeatureDescription(feature)).toBe(false)
    })
  })

  describe('isIframeComponentFeatureDescription', () => {
    it('should return true if feature is IframeComponentFeatureDescription', () => {
      const feature = {
        content_type: ContentType.TYPES.Component,
        area: ComponentArea.Editor,
      } as jest.Mocked<IframeComponentFeatureDescription>
      expect(isIframeComponentFeatureDescription(feature)).toBe(true)
    })

    it('should return false if feature is not IframeComponentFeatureDescription', () => {
      const feature = {
        content_type: ContentType.TYPES.Theme,
      } as jest.Mocked<IframeComponentFeatureDescription>
      expect(isIframeComponentFeatureDescription(feature)).toBe(false)
    })
  })

  describe('isEditorFeatureDescription', () => {
    it('should return true if feature is EditorFeatureDescription', () => {
      const feature = {
        note_type: 'test',
        area: ComponentArea.Editor,
      } as unknown as jest.Mocked<AnyFeatureDescription>
      expect(isEditorFeatureDescription(feature)).toBe(true)
    })

    it('should return false if feature is not EditorFeatureDescription', () => {
      const feature = {
        content_type: ContentType.TYPES.Theme,
      } as jest.Mocked<AnyFeatureDescription>
      expect(isEditorFeatureDescription(feature)).toBe(false)
    })
  })
})
