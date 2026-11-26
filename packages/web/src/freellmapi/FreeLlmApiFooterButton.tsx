import { useApplication } from '@/Components/ApplicationProvider'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'
import { observer } from 'mobx-react-lite'

const FreeLlmApiFooterButton = observer(() => {
  const application = useApplication()
  const controller = application.freeLlmApiController

  if (!controller || !controller.config.enabled) {
    return null
  }

  return (
    <StyledTooltip label="Local AI Notes Assistant (Desktop)">
      <button
        type="button"
        onClick={controller.toggle}
        className={`relative ml-1.5 flex h-full cursor-pointer items-center gap-1 rounded px-2 text-xs font-bold hover:text-info ${
          controller.isOpen ? 'text-info' : 'text-text'
        }`}
      >
        <span>AI Chat</span>
      </button>
    </StyledTooltip>
  )
})

export default FreeLlmApiFooterButton
