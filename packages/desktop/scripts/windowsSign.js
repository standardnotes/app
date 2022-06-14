exports.default = async function (configuration) {
  require('child_process').execSync(
    `java \
    -jar jsign/jsign-4.1.jar \
    --keystore jsign/eToken.cfg \
    --storepass "${process.env.WINDOWS_TOKEN_PASSWORD}" \
    --storetype PKCS11 \
    --tsaurl http://timestamp.digicert.com \
    --alias "${process.env.WINDOWS_TOKEN_ALIAS}" \
    "${configuration.path}"
    `,
    {
      stdio: 'inherit',
    },
  )
}
