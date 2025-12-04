const gmail = require('../gmail');
const tokenStore = require('../token-store');
const oauth2 = require('../libs/oauth2');

const { google } = require('googleapis');

const fs = require('fs');

describe('Gmail', () => {

  it('authorize works with file paths', () => {
    const cred_file = '{"installed":{"client_secret":"client_secret","client_id":"client_id","redirect_uris":["redirect_uris"]}}';
    spyOn(fs, 'readFileSync').and.returnValue(Buffer.alloc(cred_file.length, cred_file));
    spyOn(tokenStore, 'get').and.returnValue('tokenfile');

    const oAuth2Spy = jasmine.createSpyObj('oAuth2', ['setCredentials'])
    spyOn(google.auth, 'OAuth2').and.returnValue(oAuth2Spy);

    const result = gmail.authorize('cred_path', 'token_path');

    expect(fs.readFileSync).toHaveBeenCalledOnceWith('cred_path');
    expect(tokenStore.get).toHaveBeenCalledOnceWith('token_path');
    expect(result).not.toBeNull();
    expect(oAuth2Spy.setCredentials).toHaveBeenCalledOnceWith('tokenfile');
  });

  it('authorize works with json objects', () => {
    const cred_obj = {"installed":{"client_secret":"client_secret","client_id":"client_id","redirect_uris":["redirect_uris"]}};
    spyOn(fs, 'readFileSync');
    spyOn(tokenStore, 'get');

    const oAuth2Spy = jasmine.createSpyObj('oAuth2', ['setCredentials'])
    spyOn(google.auth, 'OAuth2').and.returnValue(oAuth2Spy);

    const result = gmail.authorize(cred_obj, {myObj: true});

    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(tokenStore.get).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(oAuth2Spy.setCredentials).toHaveBeenCalledOnceWith({myObj: true});
  });

  it('authorize passes custom port to authenticate when getting new token', async () => {
    const cred_obj = {"installed":{"client_secret":"client_secret","client_id":"client_id","redirect_uris":["redirect_uris"]}};

    const oAuth2Spy = jasmine.createSpyObj('oAuth2', ['setCredentials']);
    oAuth2Spy.setCredentials.and.throwError('Token not found');
    oAuth2Spy.credentials = { access_token: 'new_token' };

    spyOn(google.auth, 'OAuth2').and.returnValue(oAuth2Spy);
    spyOn(oauth2, 'authenticate').and.returnValue(Promise.resolve(oAuth2Spy));
    spyOn(tokenStore, 'store');

    const customPort = 3000;
    await gmail.authorize(cred_obj, 'token_path', customPort);

    expect(oauth2.authenticate).toHaveBeenCalledWith(
      oAuth2Spy,
      ['https://www.googleapis.com/auth/gmail.readonly'],
      'token_path',
      customPort
    );
  });

  it('authorize uses default port 32019 when no port specified', async () => {
    const cred_obj = {"installed":{"client_secret":"client_secret","client_id":"client_id","redirect_uris":["redirect_uris"]}};

    const oAuth2Spy = jasmine.createSpyObj('oAuth2', ['setCredentials']);
    oAuth2Spy.setCredentials.and.throwError('Token not found');
    oAuth2Spy.credentials = { access_token: 'new_token' };

    spyOn(google.auth, 'OAuth2').and.returnValue(oAuth2Spy);
    spyOn(oauth2, 'authenticate').and.returnValue(Promise.resolve(oAuth2Spy));
    spyOn(tokenStore, 'store');

    await gmail.authorize(cred_obj, 'token_path');

    expect(oauth2.authenticate).toHaveBeenCalledWith(
      oAuth2Spy,
      ['https://www.googleapis.com/auth/gmail.readonly'],
      'token_path',
      32019
    );
  });

});
