const fs = require('fs');
const path = require('path');

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

/**
 * Reads the token from the specified path or from default path.
 * @param {String | Object | null} token_path Path to the token file or token object
 * @returns {Object} token object
 */
function get(token_path) {
  if (typeof token_path === 'object' && token_path !== null) {
    return token_path;
  }
  try {
    return JSON.parse(fs.readFileSync(
      token_path || path.resolve(__dirname, TOKEN_PATH)
    ).toString());
  } catch (error) {
    throw new Error("No token found.");
  }
}

/**
 * Stores the token in the specified path or in default path.
 * @param {Object} token Token
 * @param {String | Object | null} token_path Path or token object (if object, no-op)
 */
function store(token, token_path) {
  if (typeof token_path === 'object' && token_path !== null) {
    return;
  }
  const file = token_path || path.resolve(__dirname, TOKEN_PATH);
  // Owner-only: the file holds a refresh token. mode only applies on create, so chmod existing files too
  fs.writeFileSync(file, JSON.stringify(token), { mode: 0o600 });
  fs.chmodSync(file, 0o600);
}

module.exports = {
  get,
  store
};
