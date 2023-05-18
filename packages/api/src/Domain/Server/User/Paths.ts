const UserPaths = {
  register: '/v1/users',
  updateAccount: (userUuid: string) => `/v1/users/${userUuid}`,
  deleteAccount: (userUuid: string) => `/v1/users/${userUuid}`,
  getPkcCredentials: (userUuid: string) => `/v1/users/${userUuid}/attributes/credentials`,
}

export const Paths = {
  v1: {
    ...UserPaths,
  },
}
