export type AnimationConfig = {
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
  initialStyle?: Partial<CSSStyleDeclaration>
}

export const EnterFromTopAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 0,
      transform: 'scaleY(0)',
    },
    {
      opacity: 1,
      transform: 'scaleY(1)',
    },
  ],
  options: {
    easing: 'ease-in-out',
    duration: 150,
    fill: 'forwards',
  },
  initialStyle: {
    transformOrigin: 'top',
  },
}

export const EnterFromBelowAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 0,
      transform: 'scaleY(0)',
    },
    {
      opacity: 1,
      transform: 'scaleY(1)',
    },
  ],
  options: {
    easing: 'ease-in-out',
    duration: 150,
    fill: 'forwards',
  },
  initialStyle: {
    transformOrigin: 'bottom',
  },
}

export const ExitToTopAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 1,
      transform: 'scaleY(1)',
    },
    {
      opacity: 0,
      transform: 'scaleY(0)',
    },
  ],
  options: {
    easing: 'ease-in-out',
    duration: 150,
    fill: 'forwards',
  },
  initialStyle: {
    transformOrigin: 'top',
  },
}

export const ExitToBelowAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 1,
      transform: 'scaleY(1)',
    },
    {
      opacity: 0,
      transform: 'scaleY(0)',
    },
  ],
  options: {
    easing: 'ease-in-out',
    duration: 150,
    fill: 'forwards',
  },
  initialStyle: {
    transformOrigin: 'bottom',
  },
}
