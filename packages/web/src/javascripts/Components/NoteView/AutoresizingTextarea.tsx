import { classNames } from '@/Utils/ConcatenateClassNames'
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef } from 'react'

// Based on: https://css-tricks.com/auto-growing-inputs-textareas/#aa-other-ideas
const AutoresizingNoteViewTextarea = forwardRef(
  (
    { value, className, ...textareaProps }: ComponentPropsWithoutRef<'textarea'>,
    ref: ForwardedRef<HTMLTextAreaElement>,
  ) => {
    return (
      <div className="relative inline-grid min-h-[75vh] w-full grid-rows-1 items-stretch md:block md:flex-grow">
        <pre
          id="textarea-mobile-resizer"
          className={classNames(
            'editable font-editor break-word whitespace-pre-wrap',
            'invisible [grid-area:1_/_1] md:hidden',
            className,
          )}
          aria-hidden
        >
          {value}{' '}
        </pre>
        <textarea
          value={value}
          className={classNames('editable font-editor [grid-area:1_/_1] md:h-full md:min-h-0', className)}
          {...textareaProps}
          ref={ref}
        ></textarea>
      </div>
    )
  },
)

export default AutoresizingNoteViewTextarea
