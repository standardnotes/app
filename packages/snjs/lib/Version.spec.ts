import { compareSemVersions, isRightVersionGreaterThanLeft } from './Version'

describe('versions', () => {
  it('isRightVersionGreaterThanLeft', () => {
    expect(isRightVersionGreaterThanLeft('0.0.0', '0.0.1')).toEqual(true)
    expect(isRightVersionGreaterThanLeft('1.0.0', '1.0.1')).toEqual(true)

    expect(isRightVersionGreaterThanLeft('0.0.1', '0.0.0')).toEqual(false)
    expect(isRightVersionGreaterThanLeft('0.1.1', '0.1.0')).toEqual(false)
    expect(isRightVersionGreaterThanLeft('1.1.1', '1.1.0')).toEqual(false)

    expect(isRightVersionGreaterThanLeft('1.0.0', '1.0.1-beta.1')).toEqual(true)
    expect(isRightVersionGreaterThanLeft('1.0.0', '1.0.1-alpha.1')).toEqual(true)
    expect(isRightVersionGreaterThanLeft('1.4.2', '1.4.3-alpha.1')).toEqual(true)
  })

  it('compareSemVersions', () => {
    expect(compareSemVersions('1.0.0', '1.0.1')).toEqual(-1)
    expect(compareSemVersions('1.0.0', '1.0.0')).toEqual(0)
    expect(compareSemVersions('1.0.1', '1.0.0')).toEqual(1)
    expect(compareSemVersions('100.0.1', '2.0.15')).toEqual(1)

    expect(compareSemVersions('2.0.1001', '2.0.1')).toEqual(1)
    expect(compareSemVersions('2.0.1001', '2.2.1')).toEqual(-1)

    expect(compareSemVersions('1.0.1-beta.1', '1.0.1-beta.1')).toEqual(0)
    expect(compareSemVersions('1.0.1-alpha.1', '1.0.1-alpha.1')).toEqual(0)
    expect(compareSemVersions('1.0.1-alpha.1', '1.0.1-alpha.2')).toEqual(-1)
  })
})
