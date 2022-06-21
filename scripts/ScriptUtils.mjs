import fs from 'fs'

export const doesDirExist = (dir) => {
  return fs.existsSync(dir)
}

export const doesFileExist = (file) => {
  return fs.existsSync(file)
}

export const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export const emptyExistingDir = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true })
  }
}

export const listDirFiles = (dir) => {
  return fs.readdirSync(dir)
}

export const writeJson = (data, path) => {
  const string = JSON.stringify(data, null, 2)
  return fs.writeFileSync(path, string)
}
