import { ListboxOption } from '@reach/listbox'
import styled from 'styled-components'

const StyledListboxOption = styled(ListboxOption)`
  &[data-reach-listbox-option] {
    align-items: center;
    background-color: transparent;
    border: none;
    color: var(--sn-stylekit-contrast-foreground-color);
    cursor: pointer;
    display: flex;
    font-size: 0.875rem;
    padding-bottom: 0.375rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    padding-top: 0.375rem;
    text-align: left;
    width: 100%;

    &[data-current-selected] {
      color: var(--sn-stylekit-info-color);
      background-color: var(--sn-stylekit-info-backdrop-color);
    }

    &:hover {
      background-color: var(--sn-stylekit-contrast-background-color);
      color: var(--sn-stylekit-foreground-color);
    }

    &:focus {
      background-color: var(--sn-stylekit-info-backdrop-color);
      box-shadow: none;
      outline: none;
    }
  }
`

export default StyledListboxOption
