const readline = require("readline");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

/**
 * Create an OAuth2 client with the given credentials.
 * @param {Object} credentials The authorization client credentials.
 */
async function getOAuthClient(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {OAuth2Client} oAuth2Client The OAuth2 client to get token for.
 * @returns {Promise<Credentials>} New Token
 *
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
          resolve(token);
        }
      });
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param gmail
 * @param {google.auth.OAuth2} oauth2Client An authorized OAuth2 client.
 */
async function list_labels(gmail, oauth2Client) {
  try {
    return await new Promise((resolve, reject) => {
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
  } catch (err) {
    console.log("The API returned an error: " + err);
    throw err;
  }
}

/**
 * Retrieve Messages in user's mailbox matching query.
 *
 * can be used to indicate the authenticated user.
 * @param gmail
 * @param oauth2Client
 * @param  {String} query String used to filter the Messages listed.
 * @param labelIds
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
      async function(err, res) {
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
                function(err, res) {
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
  return messages || [];
}

/**
 * Get the recent email from your Gmail account
 *
 * @param gmailClient
 * @param {google.auth.OAuth2} oauth2Client An authorized OAuth2 client.
 * @param {String} query String used to filter the Messages listed.
 */
async function get_recent_email(gmailClient, oauth2Client, query = "") {
  try {
    const labels = await list_labels(gmailClient, oauth2Client);
    const inbox_label_id = [labels.find(l => l.name === "INBOX").id];
    const messages = await list_messages(
      gmailClient,
      oauth2Client,
      query,
      inbox_label_id
    );
    let promises = [];
    for (let message of messages) {
      promises.push(
        new Promise((resolve, reject) => {
          gmailClient.users.messages.get(
            {
              auth: oauth2Client,
              userId: "me",
              id: message.id,
              format: "full"
            },
            function(err, res) {
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

module.exports = {
  getOAuthClient,
  get_recent_email,
  get_new_token
};
