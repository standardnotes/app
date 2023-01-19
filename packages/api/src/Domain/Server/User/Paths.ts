const UserPaths = {
  register: '/v1/users',
  deleteAccount: (userUuid: string) => `/v1/users/${userUuid}`,
}

export const Paths = {
  v1: {
    ...UserPaths,
  },
}
