const data = {
  version: 1,
  header: {
    slots: null,
    params: null,
  },
  db: {
    version: 2,
    entries: [
      {
        type: 'totp',
        uuid: 'c74a11c4-4f23-417b-818a-e11f6a4d51d7',
        name: 'test@test.com',
        issuer: 'TestMail',
        note: 'Some note',
        icon: null,
        info: {
          secret: 'TESTMAILTESTMAILTESTMAILTESTMAIL',
          algo: 'SHA1',
          digits: 6,
          period: 30,
        },
      },
      {
        type: 'totp',
        uuid: '803ed58f-b2c4-386c-9aad-645a47309124',
        name: 'test@test.com',
        issuer: 'Some Service',
        note: 'Some other service',
        icon: null,
        info: {
          secret: 'SOMESERVICESOMESERVICESOMESERVIC',
          algo: 'SHA1',
          digits: 6,
          period: 30,
        },
      },
    ],
  },
}

export default JSON.stringify(data, null, 2)
