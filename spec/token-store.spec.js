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
});
