import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'
import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'

export const useModalAnimation = (isOpen: boolean) => {
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  return useLifecycleAnimation(
    {
      open: isOpen,
      enter: {
        keyframes: [
          {
            transform: 'translateY(100%)',
          },
          {
            transform: 'translateY(0)',
          },
        ],
        options: {
          easing: 'cubic-bezier(.36,.66,.04,1)',
          duration: 250,
          fill: 'forwards',
        },
        initialStyle: {
          transformOrigin: 'bottom',
        },
      },
      enterCallback: (element) => {
        element.scrollTop = 0
      },
      exit: {
        keyframes: [
          {
            transform: 'translateY(0)',
          },
          {
            transform: 'translateY(100%)',
          },
        ],
        options: {
          easing: 'cubic-bezier(.36,.66,.04,1)',
          duration: 250,
          fill: 'forwards',
        },
        initialStyle: {
          transformOrigin: 'bottom',
        },
      },
    },
    !isMobileScreen,
  )
}
