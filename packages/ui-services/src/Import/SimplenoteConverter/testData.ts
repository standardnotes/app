const data = {
  activeNotes: [
    {
      id: '43349052-4efa-48c2-bdd6-8323124451b1',
      content: "Testing 2\r\nThis is...\r\nthe 2nd note's content.",
      creationDate: '2020-06-08T21:28:43.856Z',
      lastModified: '2021-04-16T06:21:53.124Z',
    },
    {
      id: '2a338440-4a24-4180-9805-1110d325642c',
      content: "Testing 1\r\nThis is the 1st note's content.",
      creationDate: '2020-06-08T21:28:38.241Z',
      lastModified: '2021-04-16T06:21:58.294Z',
    },
  ],
  trashedNotes: [
    {
      id: 'agtzaW1wbGUtbm90ZXIRCxIETm90ZRiAgLCvy-3gCAw',
      content: 'Welcome to Simplenote!',
      creationDate: '2020-06-08T21:28:28.434Z',
      lastModified: '2021-04-16T06:20:14.143Z',
    },
  ],
}

export default JSON.stringify(data, null, 2)
