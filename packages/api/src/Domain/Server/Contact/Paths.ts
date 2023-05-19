export const SharingPaths = {
  createContact: '/v1/contacts',
  deleteContact: (uuid: string) => `/v1/contacts/${uuid}`,
}
