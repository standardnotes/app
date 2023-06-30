export const AsymmetricMessagesPaths = {
  createMessage: '/v1/asymmetric-messages',
  getMessages: '/v1/asymmetric-messages',
  updateMessage: (messageUuid: string) => `/v1/asymmetric-messages/${messageUuid}`,
  getInboundUserMessages: () => '/v1/asymmetric-messages',
  getOutboundUserMessages: () => '/v1/asymmetric-messages/outbound',
  deleteMessage: (messageUuid: string) => `/v1/asymmetric-messages/${messageUuid}`,
  deleteAllInboundMessages: '/v1/asymmetric-messages/inbound',
}
