const tokenStore = require('../token-store');

const fs = require('fs');
const path = require('path');

describe("Token-Store", () => {

  it('does not find token and throws error', () => {
    spyOn(fs, 'readFileSync');

    expect(() => tokenStore.get(null)).toThrow(new Error('No token found.'));
  });

  it('gets token from default path in storage', () => {
    spyOn(fs, 'readFileSync').and.returnValue('{"success": true}');

    const result = tokenStore.get(null);

    expect(fs.readFileSync).toHaveBeenCalledOnceWith(path.resolve(process.cwd(), "token.json"));
    expect(result).toEqual({success: true});
  });

  it('gets token from storage', () => {
    spyOn(fs, 'readFileSync').and.returnValue('{"success": true}');

    tokenStore.get('myCustomToken.json');

    expect(fs.readFileSync).toHaveBeenCalledOnceWith("myCustomToken.json");
  });

  it('saves token in default path storage', () => {
    spyOn(fs, 'writeFileSync').and.callFake(() => {});
    spyOn(path, 'resolve').and.returnValue('myCustomToken.json');

    tokenStore.store({success: true}, null);

    expect(fs.writeFileSync).toHaveBeenCalledOnceWith('myCustomToken.json', '{"success":true}');
    expect(path.resolve).toHaveBeenCalledOnceWith(jasmine.any(String), 'token.json');
  });

  it('saves token in storage', () => {
    spyOn(fs, 'writeFileSync').and.callFake(() => {})

    tokenStore.store({success: true}, 'myCustomToken.json');

    expect(fs.writeFileSync).toHaveBeenCalledOnceWith('myCustomToken.json', '{"success":true}');
  });

  // Issue #143: token can be an object, not just a path
  describe('object token support (issue #143)', () => {
    it('get() returns token object as-is when passed an object', () => {
      const tokenObject = { access_token: 'abc123', refresh_token: 'xyz789' };
      spyOn(fs, 'readFileSync');

      const result = tokenStore.get(tokenObject);

      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(result).toEqual(tokenObject);
    });

    it('store() does not write to filesystem when token_path is an object', () => {
      const tokenObject = { access_token: 'abc123', refresh_token: 'xyz789' };
      const newToken = { access_token: 'new123', refresh_token: 'xyz789' };
      spyOn(fs, 'writeFileSync');

      tokenStore.store(newToken, tokenObject);

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});
