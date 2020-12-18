const tokenStore = require('../token-store');

const testToken = {date: new Date().getTime()};

test('tokenStore stores and retrieve same object', () => {
  tokenStore.store(testToken);
  const retrievedToken = tokenStore.get();
  expect(retrievedToken.date).toBe(testToken.date);
});