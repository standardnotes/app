const UserRequestPaths = {
  submitUserRequest: (userUuid: string) => `/v1/users/${userUuid}/requests`,
}

export const Paths = {
  v1: {
    ...UserRequestPaths,
  },
}
