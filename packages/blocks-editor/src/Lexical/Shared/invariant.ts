// invariant(condition, message) will refine types based on "condition", and
// if "condition" is false will throw an error. This function is special-cased
// in flow itself, so we can't name it anything else.
export default function invariant(cond?: boolean, _message?: string, ..._args: string[]): asserts cond {
  if (cond) {
    return
  }

  throw new Error(
    'Internal Lexical error: invariant() is meant to be replaced at compile ' + 'time. There is no runtime version.',
  )
}
