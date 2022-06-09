import styled, { css } from 'styled-components/native'

export type Props = {
  first?: boolean
  last?: boolean
  textInputCell?: any
  height?: number
  extraStyles?: any
}

export const SectionedTableCell = styled.View<Props>`
  border-bottom-color: ${props => props.theme.stylekitBorderColor};
  border-bottom-width: 1px;
  padding-left: ${props => props.theme.paddingLeft}px;
  padding-right: ${props => props.theme.paddingLeft}px;
  padding-bottom: ${props => (props.textInputCell ? 0 : 12)}px;
  background-color: ${props => props.theme.stylekitBackgroundColor};
  ${({ first, theme }) =>
    first &&
    css`
      border-top-color: ${theme.stylekitBorderColor};
      border-top-width: ${1}px;
    `};
  ${({ textInputCell }) =>
    textInputCell &&
    css`
      max-height: 50px;
    `};
  ${({ height }) =>
    height &&
    css`
      height: ${height}px;
    `};
`

export const SectionedTableCellTouchableHighlight = styled.TouchableHighlight<Props>`
  border-bottom-color: ${props => props.theme.stylekitBorderColor};
  border-bottom-width: 1px;
  padding-left: ${props => props.theme.paddingLeft}px;
  padding-right: ${props => props.theme.paddingLeft}px;
  padding-bottom: ${props => (props.textInputCell ? 0 : 12)}px;
  background-color: ${props => props.theme.stylekitBackgroundColor};
  ${({ first, theme }) =>
    first &&
    css`
      border-top-color: ${theme.stylekitBorderColor};
      border-top-width: ${1}px;
    `};
  ${({ textInputCell }) =>
    textInputCell &&
    css`
      max-height: 50px;
    `};
  ${({ height }) =>
    height &&
    css`
      height: ${height}px;
    `};
`
