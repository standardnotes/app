#!/usr/bin/env node

/* Used for running mocha tests */
const connect = require('connect')
const serveStatic = require('serve-static')

const isDev = process.argv[2] === '--dev'
const port = isDev ? 9002 : 9001

connect()
  .use(serveStatic(__dirname))
  .listen(port, () => {
    const url = `http://localhost:${port}/mocha/test.html`
    console.log(`Test Server Started on ${url}`)
    if (!isDev) {
      const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
      require('child_process').exec(start + ' ' + url)
    }
  })
