const gmail = require("./gmail");
const fs = require("fs");
const path = require('path');
const {google} = require("googleapis");
const util = require("util");
const tokenStore = require('./token-store');
const utils = require('./utils');

// Load client secrets from a local file.
module.exports = {
  check_inbox,
  get_messages
};

/**
 * Poll inbox.
 *
 * @param {string | Object} credentials_param - Path to credentials json file or credentials object.
 * @param {string | Object} token_param - Path to token json file or token object.
 * @param {Object} [options]
 * @param {boolean} [options.include_body] - Set to `true` to fetch decoded email bodies.
 * @param {string} [options.from] - Filter on the email address of the receiver.
 * @param {string} [options.to] - Filter on the email address of the sender.
 * @param {string} [options.subject] - Filter on the subject of the email.
 * @param {Date} [options.before] - Date. Filter messages received _after_ the specified date.
 * @param {Date} [options.after] - Date. Filter messages received _before_ the specified date.
 * @param {number} [options.wait_time_sec] - Interval between inbox checks (in seconds). Default: 30 seconds.
 * @param {number} [options.max_wait_time_sec] - Maximum wait time (in seconds). When reached and the email was not found, the script exits. Default: 60 seconds.
 */
async function check_inbox(
  credentials_param,
  token_param,
  options = {
    subject: undefined,
    from: undefined,
    to: undefined,
    wait_time_sec: 30,
    max_wait_time_sec: 30,
    include_body: false
  }
) {
  if (typeof options !== "object") {
    console.error(
      "[gmail-tester] This functionality is obsolete! Please pass all params of check_inbox() in options object."
    );
    process.exit(1);
  }

  const credentialsObj = _get_credentials_obj(credentials_param);
  const tokenObj = await _get_gmail_token_or_request_new_one(token_param, credentialsObj);
  return __check_inbox(credentialsObj, tokenObj, options);

}
/**
 * Get an array of messages
 *
 * @param {string | Object} credentials_param - Path to credentials json file.
 * @param {string | Object} token_param - Path to token json file.
 * @param {Object} options
 * @param {boolean} options.include_body - Return message body string.
 * @param {string} options.from - Filter on the email address of the receiver.
 * @param {string} options.to - Filter on the email address of the sender.
 * @param {string} options.subject - Filter on the subject of the email.
 * @param {Object} options.before - Date. Filter messages received _after_ the specified date.
 * @param {Object} options.after - Date. Filter messages received _before_ the specified date.
 */
async function get_messages(credentials_param, token_param, options) {
  const credentialsObj = _get_credentials_obj(credentials_param);
  const tokenObj = await _get_gmail_token_or_request_new_one(token_param, credentialsObj);

  try {
    return await _get_recent_email(
      credentialsObj,
      tokenObj,
      options
    );
  } catch (err) {
    console.log("[gmail] Error:", err);
  }
}


async function _get_recent_email(credentials, token, options = {}) {
  const emails = [];
  const query = utils.initQuery(options);
  const oAuth2Client = await gmail.getOAuthClient(credentials);
  oAuth2Client.setCredentials(token);
  const gmail_client = google.gmail({version: "v1", oAuth2Client});
  const gmail_emails = await gmail.get_recent_email(
    gmail_client,
    oAuth2Client,
    query
  );
  for (const gmail_email of gmail_emails) {
    const email = {
      from: utils.getHeader("From", gmail_email.payload.headers),
      subject: utils.getHeader("Subject", gmail_email.payload.headers),
      receiver: utils.getHeader("Delivered-To", gmail_email.payload.headers),
      date: new Date(+gmail_email["internalDate"])
    };
    if (options.include_body) {
      let email_body = {
        html: "",
        text: ""
      };
      const {body} = gmail_email.payload;
      if (body.size) {
        switch (gmail_email.payload.mimeType) {
          case "text/html":
            email_body.html = Buffer.from(body.data, "base64").toString("utf8");
            break;
          case "text/plain":
          default:
            email_body.text = Buffer.from(body.data, "base64").toString("utf8");
            break;
        }
      } else {
        let {parts} = gmail_email.payload;
        while (parts.length) {

          let part = parts.shift();
          if (part.parts) {
            parts = parts.concat(part.parts);

          }
          if (part.mimeType === "text/plain") {
            email_body.text = Buffer.from(part.body.data, "base64").toString(
              "utf8"
            );
          } else if (part.mimeType === "text/html") {
            email_body.html = Buffer.from(part.body.data, "base64").toString(
              "utf8"
            );
          }
        }

      }
      email.body = email_body;
    }
    emails.push(email);
  }
  return emails;
}


async function __check_inbox(credentials, token, options = {}) {
  const {subject, from, to, wait_time_sec, max_wait_time_sec} = options;
  try {
    console.log(
      `[gmail] Checking for message from '${from}', to: ${to}, contains '${subject}' in subject...`
    );
    let found_emails = null;
    let done_waiting_time = 0;
    do {
      const emails = await _get_recent_email(
        credentials,
        token,
        options
      );
      if (emails.length > 0) {
        console.log(`[gmail] Found!`);
        found_emails = emails;
        break;
      }
      console.log(
        `[gmail] Message not found. Waiting ${wait_time_sec} seconds...`
      );
      done_waiting_time += wait_time_sec;
      if (done_waiting_time >= max_wait_time_sec) {
        console.log("[gmail] Maximum waiting time exceeded!");
        break;
      }
      await util.promisify(setTimeout)(wait_time_sec * 1000);
    } while (!found_emails);
    return found_emails;
  } catch (err) {
    console.log("[gmail] Error:", err);
    throw err;
  }

}
function _get_gmail_token_obj(tokenParam) {
  if (!tokenParam || typeof tokenParam === "string") {
    try {
      return tokenStore.get(tokenParam);
    } catch (error) {
      throw Error("[gmail-tester] Token file not found.");
    }
  } else if (typeof tokenParam === "object") {
    return tokenParam;
  } else {
    console.error("[gmail-tester] Wrong value for token, accepted string or object");
    process.exit(1);
  }

}
async function _get_gmail_token_or_request_new_one(token, credentialsObj) {
  try {
    return _get_gmail_token_obj(token);
  } catch (error) {
    console.log(error);
    const oAuth2Client = await gmail.getOAuthClient(credentialsObj);
    const newToken = await gmail.get_new_token(oAuth2Client);
    tokenStore.store(newToken, token);
    return newToken;
  }
}

function _get_credentials_obj(credentials) {
  if (typeof credentials === "object") {
    return credentials;
  } else if (typeof credentials === "string") {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, credentials)).toString());
  } else {
    console.error("[gmail-tester] Wrong value for credentials, accepted string or object");
    process.exit(1);
  }
}
