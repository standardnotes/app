import test from 'ava'
import { lowercaseDriveLetter } from '../app/javascripts/Main/Utils/Utils'

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
