exports.default = async function (configuration) {
  if (configuration.path) {
    const keypairAlias = process.env.SM_KEYPAIR_ALIAS

    require('child_process').execSync(
      `signtool.exe sign /a /d "${String(configuration.certificateSubjectName)}" /t "http://timestamp.sectigo.com" /fd SHA256 "${String(configuration.path)}"`,
      {
        stdio: 'inherit',
      },
    )
  }
}
