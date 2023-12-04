import { classNames, IconType } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import IconButton from '../Button/IconButton'
import { ImageZoomLevelProps } from './ImageZoomLevelProps'

type Props = {
  objectUrl: string
  isEmbeddedInSuper: boolean
} & ImageZoomLevelProps

const MinimumZoomPercent = 10
const DefaultZoomPercent = 100
const MaximumZoomPercent = 1000
const ZoomPercentModifier = 10
const PercentageDivisor = 100

const ImagePreview: FunctionComponent<Props> = ({
  objectUrl,
  isEmbeddedInSuper,
  imageZoomLevel,
  setImageZoomLevel,
}) => {
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState<number>(0)
  const [imageZoomPercent, setImageZoomPercent] = useState(imageZoomLevel ? imageZoomLevel : DefaultZoomPercent)
  const [isZoomInputVisible, setIsZoomInputVisible] = useState(false)

  useEffect(() => {
    setImageZoomPercent(imageZoomLevel ? imageZoomLevel : DefaultZoomPercent)
  }, [imageZoomLevel])

  const setImageZoom = useCallback(
    (zoomLevel: number) => {
      setImageZoomPercent(zoomLevel)
      setImageZoomLevel?.(zoomLevel)
    },
    [setImageZoomLevel],
  )

  useEffect(() => {
    const image = new Image()
    image.src = objectUrl
    image.onload = () => {
      setImageWidth(image.width)
      setImageHeight(image.height)
    }
  }, [objectUrl])

  const widthIfEmbedded = imageWidth * (imageZoomPercent / PercentageDivisor)

  return (
    <div className="group relative flex h-full min-h-0 w-full items-center justify-center">
      <div
        className="relative flex h-full w-full items-center justify-center overflow-auto"
        style={{
          width: isEmbeddedInSuper ? `${widthIfEmbedded}px` : '',
          aspectRatio: isEmbeddedInSuper ? `${imageWidth} / ${imageHeight}` : '',
        }}
      >
        <img
          src={objectUrl}
          style={{
            height: isEmbeddedInSuper ? '100%' : `${imageZoomPercent}%`,
            ...(isEmbeddedInSuper
              ? {}
              : imageZoomPercent <= DefaultZoomPercent
              ? {
                  minWidth: '100%',
                  objectFit: 'contain',
                }
              : {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  margin: 'auto',
                  maxWidth: 'none',
                }),
          }}
        />
      </div>
      <div
        className={classNames(
          isEmbeddedInSuper ? 'hidden focus-within:flex group-hover:flex' : '',
          'absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center rounded border border-solid border-border bg-default px-3 py-1',
        )}
      >
        <span className="mr-1.5">{isEmbeddedInSuper ? 'Size' : 'Zoom'}:</span>
        <IconButton
          className="rounded p-1 hover:bg-contrast"
          icon={'subtract' as IconType}
          title={isEmbeddedInSuper ? 'Decrease size' : 'Zoom Out'}
          focusable={true}
          onClick={() => {
            const newPercent = imageZoomPercent - ZoomPercentModifier
            if (newPercent >= ZoomPercentModifier) {
              setImageZoom(newPercent)
            } else {
              setImageZoom(imageZoomPercent)
            }
          }}
        />
        {isZoomInputVisible ? (
          <div className="mx-2">
            <input
              type="number"
              className="w-10 bg-default text-center"
              defaultValue={imageZoomPercent}
              onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === 'Enter') {
                  const value = parseInt(event.currentTarget.value)
                  if (value >= MinimumZoomPercent && value <= MaximumZoomPercent) {
                    setImageZoom(value)
                  }
                  setIsZoomInputVisible(false)
                }
              }}
              onBlur={(event) => {
                setIsZoomInputVisible(false)
                const value = parseInt(event.currentTarget.value)
                if (value >= MinimumZoomPercent && value <= MaximumZoomPercent) {
                  setImageZoom(value)
                }
              }}
            />
            %
          </div>
        ) : (
          <button
            className="mx-1 rounded px-1.5 py-1 hover:bg-contrast"
            onClick={() => setIsZoomInputVisible((visible) => !visible)}
          >
            {imageZoomPercent}%
          </button>
        )}
        <IconButton
          className="rounded p-1 hover:bg-contrast"
          icon="add"
          title={isEmbeddedInSuper ? 'Increase size' : 'Zoom In'}
          focusable={true}
          onClick={() => {
            setImageZoom(imageZoomPercent + ZoomPercentModifier)
          }}
        />
      </div>
    </div>
  )
}

export default ImagePreview
