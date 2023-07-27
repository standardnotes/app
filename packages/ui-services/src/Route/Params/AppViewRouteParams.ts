export const ValidAppViewRoutes = ['u2f', 'extension'] as const

export type AppViewRouteParam = (typeof ValidAppViewRoutes)[number]
