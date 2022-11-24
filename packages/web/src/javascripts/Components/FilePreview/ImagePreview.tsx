import { classNames, IconType } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import IconButton from '../Button/IconButton'
import { ImageZoomLevelProps } from './ImageZoomLevelProps'

type Props = {
  objectUrl: string
  isEmbedded: boolean
} & ImageZoomLevelProps

const ImagePreview: FunctionComponent<Props> = ({ objectUrl, isEmbedded, imageZoomLevel, setImageZoomLevel }) => {
  const [imageHeight, setImageHeight] = useState<number>(0)
  const [imageZoomPercent, setImageZoomPercent] = useState(imageZoomLevel ? imageZoomLevel : 100)
  const [isZoomInputVisible, setIsZoomInputVisible] = useState(false)

  useEffect(() => {
    setImageZoomPercent(imageZoomLevel ? imageZoomLevel : 100)
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
      setImageHeight(image.height)
    }
  }, [objectUrl])

  const heightIfEmbedded = imageHeight * (imageZoomPercent / 100)

  return (
    <div className="group flex h-full min-h-0 w-full items-center justify-center">
      <div
        className="relative flex h-full w-full items-center justify-center overflow-auto"
        style={{
          height: isEmbedded ? `${heightIfEmbedded}px` : '',
        }}
      >
        <img
          src={objectUrl}
          style={{
            height: isEmbedded ? `${heightIfEmbedded}px` : `${imageZoomPercent}%`,
            ...(isEmbedded
              ? {}
              : imageZoomPercent <= 100
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
          isEmbedded ? 'hidden focus-within:flex group-hover:flex' : '',
          'absolute left-1/2 bottom-6 flex -translate-x-1/2 items-center rounded border border-solid border-border bg-default py-1 px-3',
        )}
      >
        <span className="mr-1.5">Zoom:</span>
        <IconButton
          className="rounded p-1 hover:bg-contrast"
          icon={'subtract' as IconType}
          title="Zoom Out"
          focusable={true}
          onClick={() => {
            const newPercent = imageZoomPercent - 10
            if (newPercent >= 10) {
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
              className="w-10 text-center"
              defaultValue={imageZoomPercent}
              onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === 'Enter') {
                  const value = parseInt(event.currentTarget.value)
                  if (value >= 10 && value <= 1000) {
                    setImageZoom(value)
                  }
                  setIsZoomInputVisible(false)
                }
              }}
              onBlur={(event) => {
                setIsZoomInputVisible(false)
                const value = parseInt(event.currentTarget.value)
                if (value >= 10 && value <= 1000) {
                  setImageZoom(value)
                }
              }}
            />
            %
          </div>
        ) : (
          <button
            className="mx-1 rounded py-1 px-1.5 hover:bg-contrast"
            onClick={() => setIsZoomInputVisible((visible) => !visible)}
          >
            {imageZoomPercent}%
          </button>
        )}
        <IconButton
          className="rounded p-1 hover:bg-contrast"
          icon="add"
          title="Zoom In"
          focusable={true}
          onClick={() => {
            setImageZoom(imageZoomPercent + 10)
          }}
        />
      </div>
    </div>
  )
}

export default ImagePreview
