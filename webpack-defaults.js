const Defaults = {
  platform: 'web',
};

function mergeWithEnvDefaults(env) {
  for (const key of Object.keys(Defaults)) {
    if (!env[key]) {
      env[key] = Defaults[key];
    }
  }
}

module.exports = mergeWithEnvDefaults;