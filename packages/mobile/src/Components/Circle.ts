import styled from 'styled-components/native'

type Props = {
  size?: number
  backgroundColor?: string
  borderColor?: string
}

export const Circle = styled.View<Props>`
  width: ${props => props.size ?? 12}px;
  height: ${props => props.size ?? 12}px;
  border-radius: ${props => (props.size ?? 12) / 2}px;
  background-color: ${props => props.backgroundColor};
  border-color: ${props => props.borderColor};
  border-width: 1px;
`
