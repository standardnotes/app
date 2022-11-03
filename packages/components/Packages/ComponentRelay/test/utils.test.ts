// @ts-nocheck
import { Environment } from '@standardnotes/snjs';
import {
  isValidJsonString,
  generateUuid,
  environmentToString
} from './../lib/utils';

const uuidFormat = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

describe("Utils", () => {
  describe('generateUuid', () => {
    test("length should be 36 characters", () => {
      const uuid = generateUuid();
      expect(uuid.length).toEqual(36);
    });

    it("should have a valid format", () => {
      const uuid = generateUuid();
      expect(uuid).toEqual(expect.stringMatching(uuidFormat));
    });
  });

  describe('isValidJsonString', () => {
    test("anything other than string should return false", () => {
      let result = isValidJsonString(1);
      expect(result).toBe(false);
  
      result = isValidJsonString(false);
      expect(result).toBe(false);
  
      result = isValidJsonString(1000000000000);
      expect(result).toBe(false);

      result = isValidJsonString({});
      expect(result).toBe(false);

      result = isValidJsonString([]);
      expect(result).toBe(false);

      result = isValidJsonString(() => true);
      expect(result).toBe(false);

      result = isValidJsonString(undefined);
      expect(result).toBe(false);

      result = isValidJsonString(null);
      expect(result).toBe(false);
    });
  
    test("an invalid JSON string should return false", () => {
      let result = isValidJsonString("{???}");
      expect(result).toBe(false);

      result = isValidJsonString("");
      expect(result).toBe(false);

      result = isValidJsonString("{");
      expect(result).toBe(false);
    });

    test("stringified objects should return true", () => {
      let objToStr = JSON.stringify({})
      let result = isValidJsonString(objToStr);
      expect(result).toBe(true);

      objToStr = JSON.stringify({ test: 1234, foo: "bar", testing: true })
      result = isValidJsonString(objToStr);
      expect(result).toBe(true);
    });

    test("stringified arrays should return true", () => {
      let arrToStr = JSON.stringify([])
      let result = isValidJsonString(arrToStr);
      expect(result).toBe(true);

      arrToStr = JSON.stringify([{ test: 1234, foo: "bar", testing: true }])
      result = isValidJsonString(arrToStr);
      expect(result).toBe(true);
    });
  });

  describe('environmentToString', () => {
    test('an invalid value should fallback to "web"', () => {
      let result = environmentToString(10000000);
      expect(result).toBe("web");

      result = environmentToString(-1);
      expect(result).toBe("web");

      result = environmentToString(null);
      expect(result).toBe("web");

      result = environmentToString(undefined);
      expect(result).toBe("web");

      result = environmentToString('');
      expect(result).toBe("web");

      result = environmentToString(0.01);
      expect(result).toBe("web");

      result = environmentToString({});
      expect(result).toBe("web");

      result = environmentToString([]);
      expect(result).toBe("web");

      result = environmentToString(true);
      expect(result).toBe("web");

      result = environmentToString(false);
      expect(result).toBe("web");

      result = environmentToString(() => true);
      expect(result).toBe("web");
    });

    test('Environment.Web should return "web"', () => {
      const result = environmentToString(Environment.Web);
      expect(result).toBe("web");
    });

    test('Environment.Desktop should return "desktop"', () => {
      const result = environmentToString(Environment.Desktop);
      expect(result).toBe("desktop");
    });

    test('Environment.Mobile should return "mobile"', () => {
      const result = environmentToString(Environment.Mobile);
      expect(result).toBe("mobile");
    });
  });
});
