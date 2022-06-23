import { DisclosureButton } from '@reach/disclosure'
import styled from 'styled-components'

const StyledDisplayOptionsButton = styled(DisclosureButton).attrs(() => ({
  className:
    'flex justify-center items-center min-w-8 h-8 bg-text-padding hover:bg-contrast focus:bg-contrast text-neutral border border-solid border-border rounded-full cursor-pointer',
}))<{
  pressed: boolean
}>`
  background-color: ${(props) => (props.pressed ? 'var(--sn-stylekit-contrast-background-color)' : 'transparent')};
`

export default StyledDisplayOptionsButton
