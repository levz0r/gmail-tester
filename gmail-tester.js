const gmail = require("./gmail");
const fs = require("fs");
const { google } = require("googleapis");
const util = require("util");

function _get_header(name, headers) {
  const found = headers.find(h => h.name === name);
  return found && found.value;
}

function _init_query(options) {
  const { to, from, subject, before, after } = options;
  let query = "";
  if (to) {
    query += `to:"${to}" `;
  }
  if (from) {
    query += `from:"${from}" `;
  }
  if (subject) {
    query += `subject:(${subject}) `;
  }
  if (after) {
    const after_epoch = Math.round(new Date(after).getTime() / 1000);
    query += `after:${after_epoch} `;
  }
  if (before) {
    const before_epoch = Math.round(new Date(before).getTime() / 1000);
    query += `before:${before_epoch} `;
  }
  query = query.trim();
  return query;
}

async function _get_recent_email(credentials_json, token_path, options = {}) {
  const emails = [];

  const query = _init_query(options);
  // Load client secrets from a local file.
  const content = fs.readFileSync(credentials_json);
  const oAuth2Client = await gmail.authorize(JSON.parse(content), token_path);
  const gmail_client = google.gmail({ version: "v1", oAuth2Client });
  const gmail_emails = await gmail.get_recent_email(
    gmail_client,
    oAuth2Client,
    query
  );
  for (const gmail_email of gmail_emails) {
    const email = {
      from: _get_header("From", gmail_email.payload.headers),
      subject: _get_header("Subject", gmail_email.payload.headers),
      receiver: _get_header("Delivered-To", gmail_email.payload.headers),
      date: new Date(+gmail_email["internalDate"])
    };
    if (options.include_body) {
      let email_body = {
        html: "",
        text: ""
      };
      const { body } = gmail_email.payload;
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
        let { parts } = gmail_email.payload;
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

async function __check_inbox(credentials_json, token_path, options = {}) {
  const { subject, from, to, wait_time_sec, max_wait_time_sec } = options;
  try {
    console.log(
      `[gmail] Checking for message from '${from}', to: ${to}, contains '${subject}' in subject...`
    );
    let found_emails = null;
    let done_waiting_time = 0;
    do {
      const emails = await _get_recent_email(
        credentials_json,
        token_path,
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

/**
 * Poll inbox.
 *
 * @param {string} credentials_json - Path to credentials json file.
 * @param {string} token_path - Path to token json file.
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
  credentials_json,
  token_path,
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
      "[gmail-tester] This functionality is absolete! Please pass all params of check_inbox() in options object."
    );
    process.exit(1);
  }
  return __check_inbox(credentials_json, token_path, options);
}

/**
 * Get an array of messages
 *
 * @param {string} credentials_json - Path to credentials json file.
 * @param {string} token_path - Path to token json file.
 * @param {Object} options
 * @param {boolean} options.include_body - Return message body string.
 * @param {string} options.from - Filter on the email address of the receiver.
 * @param {string} options.to - Filter on the email address of the sender.
 * @param {string} options.subject - Filter on the subject of the email.
 * @param {Object} options.before - Date. Filter messages received _after_ the specified date.
 * @param {Object} options.after - Date. Filter messages received _before_ the specified date.
 */
async function get_messages(credentials_json, token_path, options) {
  try {
    const emails = await _get_recent_email(credentials_json, token_path, options);
    return emails;
  } catch (err) {
    console.log("[gmail] Error:", err);
  }
}

async function refresh_access_token(credentials_json, token_path) {
  const content = JSON.parse(fs.readFileSync(credentials_json));
  const oAuth2Client = await gmail.authorize(content, token_path);
  const refresh_token_result = await oAuth2Client.refreshToken(
    oAuth2Client.credentials.refresh_token
  );
  if (refresh_token_result && refresh_token_result.tokens) {
    const new_token = JSON.parse(fs.readFileSync(token_path));
    if (refresh_token_result.tokens.access_token) {
      new_token.access_token = refresh_token_result.tokens.access_token;
    }
    if (refresh_token_result.tokens.refresh_token) {
      new_token.refresh_token = refresh_token_result.tokens.refresh_token;
    }
    if (refresh_token_result.tokens.expiry_date) {
      new_token.expiry_date = refresh_token_result.tokens.expiry_date;
    }
    fs.writeFileSync(token_path, JSON.stringify(new_token));
  } else {
    throw new Error(
      `Refresh access token failed! Respose: ${JSON.stringify(
        refresh_token_result
      )}`
    );
  }
}

module.exports = {
  check_inbox,
  get_messages,
  refresh_access_token
};
