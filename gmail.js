const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");
const util = require("util");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  // Check if we have previously stored a token.
  try {
    const token = fs.readFileSync(path.resolve(__dirname, TOKEN_PATH));
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (error) {
    return await get_new_token(oAuth2Client);
  }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function get_new_token(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve, reject) => {
    rl.question("Enter the code from that page here: ", async code => {
      rl.close();
      oAuth2Client.getToken(code, function(err, token) {
        if (err) {
          reject(err);
        } else {
          oAuth2Client.setCredentials(token);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
          resolve(oAuth2Client);
        }
      });
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function list_labels(gmail, oauth2Client) {
  const list = util.promisify(gmail.users.labels.list);
  try {
    const res = await list({
      userId: "me",
      auth: oauth2Client
    });
    const labels = res.data.labels;
    return labels;
  } catch (err) {
    console.log("The API returned an error: " + err);
    throw err;
  }
}

/**
 * Retrieve Messages in user's mailbox matching query.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} query String used to filter the Messages listed.
 */
async function list_messages(gmail, oauth2Client, query, labelIds) {
  const list = util.promisify(gmail.users.messages.list);
  const resp = await list({
    userId: "me",
    q: query,
    auth: oauth2Client,
    labelIds: labelIds
  });
  let result = resp.data.messages;
  while (resp.nextPageToken) {
    const resp = await list({
      userId: "me",
      q: query,
      auth: oauth2Client,
      labelIds: labelIds,
      pageToken: nextPageToken
    });
    result = result.concat(resp.data.messages);
  }
  return result;
}

/**
 * Get the recent email from your Gmail account
 *
 * @param {google.auth.OAuth2} oauth2Client An authorized OAuth2 client.
 */
async function get_recent_email(gmail, oauth2Client) {
  try {
    const labels = await list_labels(gmail, oauth2Client);
    const inbox_label_id = [labels.find(l => l.name === "INBOX").id];
    const messages = await list_messages(
      gmail,
      oauth2Client,
      "",
      inbox_label_id
    );
    let promises = [];
    const messages_get = util.promisify(gmail.users.messages.get);
    for (let message of messages) {
      promises.push(
        messages_get({ auth: oauth2Client, userId: "me", id: message.id })
      );
    }
    const results = await Promise.all(promises);
    return results.map(r => r.data);
  } catch (error) {}
}

module.exports = {
  authorize,
  get_recent_email
};
