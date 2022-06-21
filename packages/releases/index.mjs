import Components from '../components/package.json' assert { type: 'json' }
import Desktop from '../desktop/package.json' assert { type: 'json' }
import Mobile from '../mobile/package.json' assert { type: 'json' }
import Web from '../web/package.json' assert { type: 'json' }
import { writeJson, ensureDirExists } from '../../scripts/ScriptUtils.mjs'

const Releases = {
  [Components.name]: Components.version,
  [Desktop.name]: Desktop.version,
  [Mobile.name]: Mobile.version,
  [Web.name]: Web.version,
}

ensureDirExists('dist')
writeJson(Releases, 'dist/releases.json')
