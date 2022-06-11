import styled from 'styled-components'
import { useAppSelector } from '../../app/hooks'

const Container = styled.div`
  background-color: var(--sn-stylekit-background-color);
  border: 1px solid var(--sn-stylekit-border-color);
  border-radius: 8px;
  box-sizing: border-box;
  height: 100%;
  padding: 16px;
  margin-bottom: 9px;
`

const InvalidContentError: React.FC = () => {
  const lastError = useAppSelector((state) => state.tasks.lastError)
  return (
    <Container>
      {lastError ||
        'An unknown error has occurred, and the content cannot be displayed.'}
    </Container>
  )
}

export default InvalidContentError
