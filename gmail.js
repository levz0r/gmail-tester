const readline = require("readline");
const { google } = require("googleapis");
const tokenStore = require("./token-store");
const fs = require("fs");
const { authenticate } = require("./libs/oauth2");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {string | Object} credentials The authorization client credentials.
 * @param {string | Object} token  Token.
 * @return {google.auth.OAuth2} The OAuth2Client.
 */
async function authorize(credentials, token) {
  const { client_secret, client_id, redirect_uris } =
    _get_credentials_object(credentials).installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  // Check if we have previously stored a token.
  try {
    oAuth2Client.setCredentials(_get_token_object(token));
    return oAuth2Client;
  } catch (error) {
    const newOAuth2Client = await get_new_token(oAuth2Client, token);
    if (token instanceof Object) {
      tokenStore.store(newOAuth2Client.credentials);
    } else {
      tokenStore.store(newOAuth2Client.credentials, token);
    }
    return newOAuth2Client;
  }
}

/**
 * Get a new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @return {Promise<google.auth.OAuth2>} The promise for the authorized client.
 */
async function get_new_token(oAuth2Client, token) {
  return authenticate(oAuth2Client, SCOPES, token);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function list_labels(gmail, oauth2Client) {
  try {
    const labels = await new Promise((resolve, reject) => {
      gmail.users.labels.list(
        {
          userId: "me",
          auth: oauth2Client
        },
        function (err, res) {
          if (err) {
            reject(err);
          } else {
            const labels = res.data.labels;
            resolve(labels);
          }
        }
      );
    });
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
  const messages = await new Promise((resolve, reject) => {
    gmail.users.messages.list(
      {
        userId: "me",
        q: query,
        auth: oauth2Client,
        labelIds: labelIds
      },
      async function (err, res) {
        if (err) {
          reject(err);
        } else {
          let result = res.data.messages || [];
          let { nextPageToken } = res.data;
          while (nextPageToken) {
            const resp = await new Promise((resolve, reject) => {
              gmail.users.messages.list(
                {
                  userId: "me",
                  q: query,
                  auth: oauth2Client,
                  labelIds: labelIds,
                  pageToken: nextPageToken
                },
                function (err, res) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(res);
                  }
                }
              );
            });
            result = result.concat(resp.data.messages);
            nextPageToken = resp.data.nextPageToken;
          }
          resolve(result);
        }
      }
    );
  });
  let result = messages || [];
  return result;
}

/**
 * Get the recent email from your Gmail account
 *
 * @param {google.auth.OAuth2} oauth2Client An authorized OAuth2 client.
 * @param {string} query String used to filter the Messages listed.
 * @param {string} label Email label. Default = INBOX.
 */
async function get_recent_email(oauth2Client, query = "", label = "INBOX") {
  try {
    const gmail_client = _gmail_client(oauth2Client);
    const labels = await list_labels(gmail_client, oauth2Client);
    const inbox_label_id = [labels.find(l => l.name === label).id];
    const messages = await list_messages(
      gmail_client,
      oauth2Client,
      query,
      inbox_label_id
    );
    let promises = [];
    for (let message of messages) {
      promises.push(
        new Promise((resolve, reject) => {
          gmail_client.users.messages.get(
            {
              auth: oauth2Client,
              userId: "me",
              id: message.id,
              format: "full"
            },
            function (err, res) {
              if (err) {
                reject(err);
              } else {
                resolve(res);
              }
            }
          );
        })
      );
    }
    const results = await Promise.all(promises);
    return results.map(r => r.data);
  } catch (error) {
    console.log("Error when getting recent emails: " + error);
    throw error;
  }
}

/**
 * Get the attachments of the email
 *
 * @param {google.auth.OAuth2} oauth2Client An authorized OAuth2 client.
 * @param {Object} gmail_email Email object.
 * @return {Promise<Awaited<{ data: base64Data, filename: string, mimeType: string }[]>>}
 */
async function get_email_attachments(oauth2Client, gmail_email) {
  const parts = gmail_email.payload.parts || [];
  const attachment_infos = parts
    .filter(part => part.body.size && part.body.attachmentId)
    .map(({ body, filename, mimeType }) => ({
      id: body.attachmentId,
      filename,
      mimeType
    }));

  return Promise.all(
    attachment_infos.map(async ({ id, filename, mimeType }) => {
      const {
        data: { data: base64Data }
      } = await _gmail_client(oauth2Client).users.messages.attachments.get({
        auth: oauth2Client,
        userId: "me",
        messageId: gmail_email.id,
        id
      });
      return { data: base64Data, filename, mimeType };
    })
  );
}

function _gmail_client(oAuth2Client) {
  return google.gmail({ version: "v1", oAuth2Client });
}

function _get_credentials_object(credentials) {
  if (credentials instanceof Object) {
    return credentials;
  }
  return JSON.parse(fs.readFileSync(credentials));
}

function _get_token_object(token) {
  if (token instanceof Object) {
    return token;
  }
  return tokenStore.get(token);
}

module.exports = {
  authorize,
  get_recent_email,
  get_email_attachments
};
