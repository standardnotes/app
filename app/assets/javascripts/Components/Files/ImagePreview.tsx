import { IconType } from '@standardnotes/snjs'
import { FunctionComponent } from 'preact'
import { useRef, useState } from 'preact/hooks'
import { IconButton } from '../Button/IconButton'

type Props = {
  objectUrl: string
}

export const ImagePreview: FunctionComponent<Props> = ({ objectUrl }) => {
  const initialImgHeightRef = useRef<number>()

  const [imageZoomPercent, setImageZoomPercent] = useState(100)

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-center justify-center w-full h-full relative overflow-auto">
        <img
          src={objectUrl}
          style={{
            height: `${imageZoomPercent}%`,
            ...(imageZoomPercent <= 100
              ? {
                  'min-width': '100%',
                  'object-fit': 'contain',
                }
              : {
                  position: 'absolute',
                  inset: 0,
                  margin: 'auto',
                }),
          }}
          ref={(imgElement) => {
            if (!initialImgHeightRef.current) {
              initialImgHeightRef.current = imgElement?.height
            }
          }}
        />
      </div>
      <div className="flex items-center absolute left-1/2 -translate-x-1/2 bottom-6 py-1 px-3 bg-default border-1 border-solid border-main rounded">
        <span className="mr-1.5">Zoom:</span>
        <IconButton
          className="hover:bg-contrast p-1 rounded"
          icon={'subtract' as IconType}
          title="Zoom Out"
          focusable={true}
          onClick={() => {
            setImageZoomPercent((percent) => {
              const newPercent = percent - 10
              if (newPercent >= 10) {
                return newPercent
              } else {
                return percent
              }
            })
          }}
        />
        <span className="mx-2">{imageZoomPercent}%</span>
        <IconButton
          className="hover:bg-contrast p-1 rounded"
          icon="add"
          title="Zoom In"
          focusable={true}
          onClick={() => {
            setImageZoomPercent((percent) => percent + 10)
          }}
        />
      </div>
    </div>
  )
}
