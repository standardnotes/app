import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'
import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'

export const IosModalAnimationEasing = 'cubic-bezier(.36,.66,.04,1)'

const Animations = {
  vertical: {
    enter: {
      keyframes: [
        {
          transform: 'translateY(100%)',
        },
        {
          transform: 'translateY(0)',
        },
      ],
      transformOrigin: 'bottom',
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
      transformOrigin: 'bottom',
    },
  },
  horizontal: {
    enter: {
      keyframes: [
        {
          transform: 'translateX(100%)',
        },
        {
          transform: 'translateX(0)',
        },
      ],
      transformOrigin: 'right',
    },
    exit: {
      keyframes: [
        {
          transform: 'translateX(0)',
        },
        {
          transform: 'translateX(100%)',
        },
      ],
      transformOrigin: 'right',
    },
  },
}

export const useModalAnimation = (isOpen: boolean, variant: 'horizontal' | 'vertical' = 'vertical') => {
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  return useLifecycleAnimation(
    {
      open: isOpen,
      enter: {
        keyframes: Animations[variant].enter.keyframes,
        options: {
          easing: IosModalAnimationEasing,
          duration: 250,
          fill: 'forwards',
        },
        initialStyle: {
          transformOrigin: Animations[variant].enter.transformOrigin,
        },
      },
      enterCallback: (element) => {
        element.scrollTop = 0
      },
      exit: {
        keyframes: Animations[variant].exit.keyframes,
        options: {
          easing: IosModalAnimationEasing,
          duration: 250,
          fill: 'forwards',
        },
        initialStyle: {
          transformOrigin: Animations[variant].exit.transformOrigin,
        },
      },
    },
    !isMobileScreen,
  )
}
