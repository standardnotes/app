import { DisclosureButton } from '@reach/disclosure'
import styled from 'styled-components'

const StyledDisplayOptionsButton = styled(DisclosureButton).attrs(() => ({
  className:
    'flex justify-center items-center min-w-8 h-8 bg-color-padding hover:bg-contrast focus:bg-contrast color-neutral border-1 border-solid border-main rounded-full cursor-pointer',
}))<{
  pressed: boolean
}>`
  background-color: ${(props) => (props.pressed ? 'var(--sn-stylekit-contrast-background-color)' : 'transparent')};
`

export default StyledDisplayOptionsButton
