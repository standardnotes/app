const packageJson = require('./package.json')

module.exports = {
  ...packageJson.build,
  afterSign: null,
  win: {
    ...packageJson.build.win,
    certificateSubjectName: null,
    publisherName: null,
    sign: null,
    signDlls: false,
  },
}
