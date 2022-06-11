import './styles.scss'

import { memo } from 'react'
import PropTypes, { InferProps } from 'prop-types'

export const enum SplitViewDirection {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

const enum SplitViewType {
  Row = 'row',
  Column = 'column',
}

const propTypes = {
  split: PropTypes.bool.isRequired,
  direction: PropTypes.oneOf([
    SplitViewDirection.Horizontal,
    SplitViewDirection.Vertical,
  ]).isRequired,
  children: PropTypes.arrayOf(PropTypes.element).isRequired,
}

type SplitViewProps = InferProps<typeof propTypes>

const SplitView: React.FC<SplitViewProps> = ({
  children,
  split,
  direction,
}) => {
  const childClassName =
    direction === SplitViewDirection.Horizontal
      ? SplitViewType.Column
      : SplitViewType.Row

  return (
    <div className={`container ${direction}`}>
      <div className={`${childClassName} ${split ? 'half' : 'full'}`}>
        {children[0]}
      </div>
      {split && (
        <>
          <div className="separator" />
          <div className={`${childClassName} half`}>{children[1]}</div>
        </>
      )}
    </div>
  )
}

SplitView.propTypes = propTypes

export default memo(SplitView)
