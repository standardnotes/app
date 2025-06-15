import { ElementFormatType } from 'lexical'

export type OptionalSuperEmbeddedImageProps = {
  imageZoomLevel?: number
  setImageZoomLevel?: (zoomLevel: number) => void
  alignment?: ElementFormatType | null
  changeAlignment?: (alignment: ElementFormatType) => void
}
