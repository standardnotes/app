export const ContactPaths = {
  createContact: '/v1/contacts',
  deleteContact: (uuid: string) => `/v1/contacts/${uuid}`,
  refreshAll: '/v1/contacts/refresh-all',
}
