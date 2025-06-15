import { IconType, PrefKey } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import IconButton from '@/Components/Button/IconButton'
import { OptionalSuperEmbeddedImageProps } from './OptionalSuperEmbeddedImageProps'
import usePreference from '@/Hooks/usePreference'
import { getCSSValueFromAlignment, ImageAlignmentOptions } from './ImageAlignmentOptions'

type Props = {
  objectUrl: string
  isEmbeddedInSuper: boolean
} & OptionalSuperEmbeddedImageProps

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
  alignment,
  changeAlignment,
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

  const imageResizer = (
    <>
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
    </>
  )

  const defaultSuperImageAlignment = usePreference(PrefKey.SuperNoteImageAlignment)
  const finalAlignment = alignment || defaultSuperImageAlignment
  const justifyContent = isEmbeddedInSuper ? getCSSValueFromAlignment(finalAlignment) : 'center'

  return (
    <div className="group relative flex h-full min-h-0 w-full items-center" style={{ justifyContent }}>
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
      {!isEmbeddedInSuper && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center rounded border border-solid border-border bg-default px-3 py-1">
          {imageResizer}
        </div>
      )}
      {isEmbeddedInSuper && (
        <div className="invisible absolute bottom-full left-1/2 z-10 -translate-x-1/2 px-1 pb-1 focus-within:visible group-hover:visible [.embedBlockFocused_&]:visible">
          <div className="flex divide-x divide-border rounded border border-border bg-default">
            {changeAlignment && (
              <div className="flex items-center gap-1 px-1 py-0.5">
                <ImageAlignmentOptions alignment={finalAlignment} changeAlignment={changeAlignment} />
              </div>
            )}
            <div className="flex items-center px-2 py-0.5 text-sm">{imageResizer}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImagePreview
