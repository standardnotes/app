export const Command = function (prompt, dir, extraEnv = {}) {
  return {
    prompt,
    dir,
    extraEnv,
  }
}
