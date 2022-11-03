import Logger from './../lib/logger';

describe("Logger", () => {
  let consoleLog;
  let consoleError;

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log');
    consoleError = jest.spyOn(console, 'error');
  });

  it('should not output messages to console if not enabled', () => {
    Logger.enabled = false;
    Logger.info('A simple message.');
    expect(Logger.enabled).toBe(false);
    expect(consoleLog).not.toBeCalled();
  });

  it('should output messages to console if "enabled" is true', () => {
    Logger.enabled = true;
    Logger.info('A simple message.');
    expect(Logger.enabled).toBe(true);
    expect(consoleLog).toBeCalledTimes(1);
    expect(consoleLog).toBeCalledWith('A simple message.');
  });

  it('should output errors to console if "enabled" is false', () => {
    Logger.enabled = false;
    Logger.error('An error occured.');
    expect(Logger.enabled).toBe(false);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith('An error occured.');
  });

  it('should output errors to console if "enabled" is true', () => {
    Logger.enabled = true;
    Logger.error('An error occured.');
    expect(Logger.enabled).toBe(true);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith('An error occured.');
  });
});
