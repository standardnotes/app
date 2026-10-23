import test from 'ava'
import { fileUrlsAreEqual, lowercaseDriveLetter } from '../app/javascripts/Main/Utils/Utils'

const posix = { isWindows: false }
const windows = { isWindows: true }

test("lowerCaseDriverLetter converts the drive letter of a given file's path to lower case", (t) => {
  t.is(lowercaseDriveLetter('/C:/Lansing'), '/c:/Lansing')
  t.is(lowercaseDriveLetter('/c:/Bone Rage'), '/c:/Bone Rage')
  t.is(lowercaseDriveLetter('/C:/Give/Us/the/Gold'), '/c:/Give/Us/the/Gold')
})

test('lowerCaseDriverLetter only changes a single drive letter', (t) => {
  t.is(lowercaseDriveLetter('C:/Hold Me In'), 'C:/Hold Me In')
  t.is(lowercaseDriveLetter('/Cd:/Egg Replacer'), '/Cd:/Egg Replacer')
  t.is(lowercaseDriveLetter('/C:radle of Rocks'), '/C:radle of Rocks')
})

const macAppUrl = 'file:///Applications/Standard Notes.app/Contents/Resources/app.asar/dist/index.html'

test('fileUrlsAreEqual accepts the app url itself, including reloads with encoded spaces, queries and hashes', (t) => {
  t.true(fileUrlsAreEqual(macAppUrl, macAppUrl, posix))
  t.true(
    fileUrlsAreEqual(
      'file:///Applications/Standard%20Notes.app/Contents/Resources/app.asar/dist/index.html',
      macAppUrl,
      posix,
    ),
  )
  t.true(
    fileUrlsAreEqual(
      'file:///Applications/Standard%20Notes.app/Contents/Resources/app.asar/dist/index.html#!/',
      macAppUrl,
      posix,
    ),
  )
  t.true(
    fileUrlsAreEqual(
      'file:///Applications/Standard%20Notes.app/Contents/Resources/app.asar/dist/index.html?foo=bar',
      macAppUrl,
      posix,
    ),
  )
  t.true(fileUrlsAreEqual('file:///opt/sn/dist/index.html', 'file://localhost/opt/sn/dist/index.html', posix))
})

test('fileUrlsAreEqual handles the Windows url as built by Urls.indexHtml and as reported by navigation events', (t) => {
  const builtStartUrl = 'file://C:\\Users\\me\\AppData\\app.asar\\dist\\index.html'
  t.true(fileUrlsAreEqual('file:///C:/Users/me/AppData/app.asar/dist/index.html', builtStartUrl, windows))
  t.true(fileUrlsAreEqual('file:///c:/Users/me/AppData/app.asar/dist/index.html', builtStartUrl, windows))
  t.true(fileUrlsAreEqual('file:///C:/Users/me/AppData/app.asar/dist/index.html#!/', builtStartUrl, windows))
})

test('fileUrlsAreEqual rejects a different scheme with the same path', (t) => {
  t.false(
    fileUrlsAreEqual(
      'https://attacker.example/Applications/Standard%20Notes.app/Contents/Resources/app.asar/dist/index.html',
      macAppUrl,
      posix,
    ),
  )
  t.false(fileUrlsAreEqual('http://attacker.example/opt/sn/dist/index.html', 'file:///opt/sn/dist/index.html', posix))
  t.false(fileUrlsAreEqual('ftp://attacker.example/opt/sn/dist/index.html', 'file:///opt/sn/dist/index.html', posix))
  t.false(fileUrlsAreEqual('javascript:alert(1)', macAppUrl, posix))
  t.false(fileUrlsAreEqual('data:text/html,<h1>hi</h1>', macAppUrl, posix))
  t.false(fileUrlsAreEqual('custom-scheme://host/opt/sn/dist/index.html', 'file:///opt/sn/dist/index.html', posix))
})

test('fileUrlsAreEqual rejects a file url with a different host (e.g. a UNC share) and the same path', (t) => {
  t.false(fileUrlsAreEqual('file://attacker.example/opt/sn/dist/index.html', 'file:///opt/sn/dist/index.html', posix))
  t.false(fileUrlsAreEqual('file://attacker/share/dist/index.html', 'file:///share/dist/index.html', windows))
})

test('fileUrlsAreEqual rejects a different local file', (t) => {
  t.false(fileUrlsAreEqual('file:///opt/sn/dist/other.html', 'file:///opt/sn/dist/index.html', posix))
  t.false(fileUrlsAreEqual('file:///opt/sn/dist/index.html.evil', 'file:///opt/sn/dist/index.html', posix))
  t.false(fileUrlsAreEqual('file:///opt/sn/dist/../index.html', 'file:///opt/sn/dist/index.html', posix))
  t.false(fileUrlsAreEqual('file:///opt/sn/dist/index.html', 'file:///opt/other/dist/index.html', posix))
})

test('fileUrlsAreEqual is case sensitive for paths on non-Windows platforms', (t) => {
  t.false(fileUrlsAreEqual('file:///opt/SN/dist/index.html', 'file:///opt/sn/dist/index.html', posix))
})

test('fileUrlsAreEqual fails closed on malformed urls', (t) => {
  t.false(fileUrlsAreEqual('', macAppUrl, posix))
  t.false(fileUrlsAreEqual('not a url', macAppUrl, posix))
  t.false(fileUrlsAreEqual(macAppUrl, '', posix))
  t.false(fileUrlsAreEqual('https://', macAppUrl, posix))
})

test('fileUrlsAreEqual tolerates a literal percent sign in the install path', (t) => {
  t.true(fileUrlsAreEqual('file:///home/me/100%25/dist/index.html', 'file:///home/me/100%/dist/index.html', posix))
})
