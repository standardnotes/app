import {
  getIndexOfQueryInString,
  splitQueryInString,
  splitRangeWithinString,
} from './stringUtils';

describe('string utils', () => {
  describe('splitRangeWithinString', () => {
    it('should return whole string if range is invalid or out of bounds', () => {
      const string = 'test-string';

      const outOfBoundsStartResult = splitRangeWithinString(string, 15, 0);
      expect(outOfBoundsStartResult).toStrictEqual(['test-string']);

      const outOfBoundsEndResult = splitRangeWithinString(string, 0, -15);
      expect(outOfBoundsEndResult).toStrictEqual(['test-string']);

      const invalidRangeResult = splitRangeWithinString(string, 15, 0);
      expect(invalidRangeResult).toStrictEqual(['test-string']);
    });

    it('should return split string if range is valid', () => {
      const string = 'test-string';

      const case1 = splitRangeWithinString(string, 0, 3);
      expect(case1).toStrictEqual(['tes', 't-string']);

      const case2 = splitRangeWithinString(string, 2, 6);
      expect(case2).toStrictEqual(['te', 'st-s', 'tring']);

      const case3 = splitRangeWithinString(string, 4, 9);
      expect(case3).toStrictEqual(['test', '-stri', 'ng']);
    });
  });

  describe('getIndexOfQueryInString', () => {
    it('should get correct index of query in string', () => {
      const string = 'tEsT-sTrInG';

      const indexOfQuery1 = getIndexOfQueryInString(string, 'tRi');
      expect(indexOfQuery1).toBe(6);

      const indexOfQuery2 = getIndexOfQueryInString(string, 'StR');
      expect(indexOfQuery2).toBe(5);

      const indexOfQuery3 = getIndexOfQueryInString(string, 'stringUtils');
      expect(indexOfQuery3).toBe(-1);
    });
  });

  describe('splitQueryInString', () => {
    it('should split string if it includes the query', () => {
      const string = 'TeSt-StRiNg';

      const query1Result = splitQueryInString(string, 'T-sTr');
      expect(query1Result).toStrictEqual(['TeS', 't-StR', 'iNg']);

      const query2Result = splitQueryInString(string, 'InG');
      expect(query2Result).toStrictEqual(['TeSt-StR', 'iNg']);

      const query3Result = splitQueryInString(string, 'invalid query');
      expect(query3Result).toStrictEqual(['TeSt-StRiNg']);
    });
  });
});
