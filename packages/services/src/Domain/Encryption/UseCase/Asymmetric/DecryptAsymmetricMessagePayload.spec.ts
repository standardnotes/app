describe('DecryptAsymmetricMessagePayload', () => {
  it('should fail if matching public key is locally revoked', () => {
    throw new Error('TODO')
  })

  it('should fail if signature is invalid', () => {})

  describe('with trusted sender', () => {
    it('should fail if encryption public key is not trusted', () => {})

    it('should fail if signing public key is not trusted', () => {})

    it('should succeed with valid signature and encryption key', () => {})
  })

  describe('without trusted sender', () => {
    it('should succeed with valid signature and encryption key', () => {})
  })
})
