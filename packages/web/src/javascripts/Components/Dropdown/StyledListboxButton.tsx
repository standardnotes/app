import { ListboxButton } from '@reach/listbox'
import styled from 'styled-components'

const StyledListboxButton = styled(ListboxButton)`
  &[data-reach-listbox-button] {
    background-color: var(--sn-stylekit-background-color);
    border-radius: 0.25rem;
    border: 1px solid var(--sn-stylekit-border-color);
    color: var(--sn-stylekit-contrast-foreground-color);
    font-size: 0.875rem;
    line-height: 1.25rem;
    min-width: 13.75rem;
    padding-bottom: 0.375rem;
    padding-left: 0.875rem;
    padding-right: 0.875rem;
    padding-top: 0.375rem;
    width: fit-content;
  }
`

export default StyledListboxButton
