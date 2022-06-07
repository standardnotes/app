import { execSync } from 'child_process'
;(async () => {
  const version = process.argv[2]
  if (!version) {
    console.error('Must specify a version number.')
    process.exitCode = 1
    return
  }
  execSync(`yarn version --no-git-tag-version --new-version ${version}`)
  process.chdir('app')
  execSync(`yarn version --no-git-tag-version --new-version ${version}`)
  process.chdir('..')
  execSync('git add package.json app/package.json')
  execSync(`git commit -m "chore(version): ${version}"`)
})()
