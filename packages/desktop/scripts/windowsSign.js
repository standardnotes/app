exports.default = async function (configuration) {
  if (configuration.path) {
    require('child_process').execSync(
      `smctl sign --keypair-alias=snkeypair --input "${String(configuration.path)}" --verbose`,
      {
        stdio: 'inherit',
      },
    )
  }
}
