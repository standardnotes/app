exports.default = async function (configuration) {
  if (configuration.path) {
    const keypairAlias = process.env.SM_KEYPAIR_ALIAS

    require('child_process').execSync(
      `smctl sign --keypair-alias="${keypairAlias}" --input "${String(configuration.path)}" --verbose`,
      {
        stdio: 'inherit',
      },
    )
  }
}
