import styled from 'styled-components'

export const SubTitle = styled.h3`
  color: var(--sn-stylekit-foreground-color);
  cursor: pointer;
  font-size: var(--sn-stylekit-font-size-h3);
  font-weight: 500;
  margin: 10px 0px;
  opacity: 0.55;

  &::first-letter {
    text-transform: capitalize;
  }
`
