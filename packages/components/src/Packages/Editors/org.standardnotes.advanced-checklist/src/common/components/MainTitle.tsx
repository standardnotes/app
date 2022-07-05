import styled from 'styled-components'

type Header1Props = {
  crossed: boolean
}

const Header1 = styled.h1<Header1Props>`
  color: var(--sn-stylekit-editor-foreground-color);
  display: inline;
  font-size: 1.125rem !important;
  margin-right: 10px !important;
  text-decoration: ${({ crossed }) => (crossed ? 'line-through' : 'none')};
`

type MainTitleProps = {
  highlight?: boolean
  crossed?: boolean
}

export const MainTitle: React.FC<MainTitleProps> = ({ children, highlight = false, crossed = false, ...props }) => {
  return (
    <Header1 className={`sk-h1 ${highlight ? 'info' : ''}`} crossed={crossed} {...props}>
      {children}
    </Header1>
  )
}
