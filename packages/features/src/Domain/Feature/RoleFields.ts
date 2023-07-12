export type RoleFields = {
  /** Server populated */
  role_name?: string

  /** Statically populated. Non-influencing; used as a reference by other static consumers (such as email service) */
  availableInRoles: string[]
}
