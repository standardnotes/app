export const AsymmetricMessagesPaths = {
  createMessage: '/v1/messages',
  getMessages: '/v1/messages',
  updateMessage: (messageUuid: string) => `/v1/messages/${messageUuid}`,
  getInboundUserMessages: () => '/v1/messages',
  getOutboundUserMessages: () => '/v1/messages/outbound',
  deleteMessage: (messageUuid: string) => `/v1/messages/${messageUuid}`,
  deleteAllInboundMessages: '/v1/messages/inbound',
}
