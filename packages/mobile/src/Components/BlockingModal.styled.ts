import styled from 'styled-components/native'

export const Container = styled.View`
  flex: 1;
  background-color: transparent;
  align-items: center;
  justify-content: center;
`

export const Content = styled.View`
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
  padding: 20px;
  border-radius: 10px;
  width: 80%;
`

export const Title = styled.Text`
  color: ${({ theme }) => theme.stylekitForegroundColor};
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
`

export const Subtitle = styled.Text`
  color: ${({ theme }) => theme.stylekitForegroundColor};
  font-size: 14px;
  text-align: center;
`
