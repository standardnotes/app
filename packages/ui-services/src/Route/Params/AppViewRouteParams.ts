export const ValidAppViewRoutes = ['u2f'] as const

export type AppViewRouteParam = typeof ValidAppViewRoutes[number]
