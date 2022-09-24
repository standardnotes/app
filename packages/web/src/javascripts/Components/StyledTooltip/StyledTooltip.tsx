import Tooltip from '@reach/tooltip'
import styled from 'styled-components'

export default styled(Tooltip)`
  &[data-reach-tooltip] {
    border-radius: 0.25rem;
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
    background-color: var(--sn-stylekit-contrast-background-color);
    color: var(--sn-stylekit-foreground-color);
    border-color: var(--sn-stylekit-border-color);
    z-index: var(--z-index-tooltip);
  }
`
