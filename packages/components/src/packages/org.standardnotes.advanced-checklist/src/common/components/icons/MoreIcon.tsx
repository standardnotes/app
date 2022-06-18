import styled from 'styled-components'

const Ellipsis = ({ ...props }) => (
  <span aria-hidden {...props}>
    …
  </span>
)

/**
 * SVG icons don't work well with the MenuButton components.
 * So we create a text-based replacement for it.
 */
export const MoreIcon = styled(Ellipsis)`
  font-weight: 800;
  height: 18px;
  line-height: 10px;
`
