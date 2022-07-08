/* Used for running mocha tests */
const connect = require('connect')
const serveStatic = require('serve-static')
const fs = require('fs')

const isDev = process.argv[2] === '--dev'
const port = isDev ? 9002 : 9001

const snCryptoDistFilePath = `${__dirname}/../sncrypto-web/dist/sncrypto-web.js`
if (!fs.existsSync(snCryptoDistFilePath)) {
  console.error(
    `Could not find sncrypto dist file under: ${snCryptoDistFilePath}. Please consider building the project first`,
  )

  process.exit(1)
}

fs.copyFileSync(snCryptoDistFilePath, `${__dirname}/mocha/vendor/sncrypto-web.js`)

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
