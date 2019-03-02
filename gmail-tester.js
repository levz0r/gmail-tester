const gmail = require("./gmail");
const fs = require("fs");
const { google } = require("googleapis");
const util = require("util");

async function check_inbox(
  credentials_json,
  token_path,
  subject,
  from,
  to,
  wait_time_sec = 30,
  max_wait_time = 60
) {
  try {
    console.log(
      `[gmail] Checking for message from '${from}', to: ${to}, contains '${subject}' in subject...`
    );
    // Load client secrets from a local file.
    const content = fs.readFileSync(
      credentials_json
    );
    const oAuth2Client = await gmail.authorize(JSON.parse(content), token_path);
    const gmail_client = google.gmail({ version: "v1", oAuth2Client });
    let found_email = null;
    let done_waiting_time = 0;
    do {
      const emails = await gmail.get_recent_email(gmail_client, oAuth2Client);
      for (let email of emails) {
        const from_header = email.payload.headers.find(h => h.name === "From");
        const subject_header = email.payload.headers.find(
          h => h.name === "Subject"
        );
        const delived_to_header = email.payload.headers.find(
          h => h.name === "Delivered-To"
        );
        if (
          (delived_to_header && delived_to_header.value) === to &&
          subject_header.value.indexOf(subject) >= 0 &&
          from_header.value.indexOf(from) >= 0
        ) {
          console.log(`[gmail] Found!`);
          found_email = email;
          break;
        }
      }
      if (!found_email) {
        console.log(
          `[gmail] Message not found. Waiting ${wait_time_sec} seconds...`
        );
        done_waiting_time += wait_time_sec;
        if (done_waiting_time >= max_wait_time) {
          console.log("[gmail] Maximum waiting time exceeded!");
          break;
        }
        await util.promisify(setTimeout)(wait_time_sec * 1000);
      }
    } while (!found_email);
    return found_email;
  } catch (err) {
    return console.log("[gmail] Error:", err);
  }
}

module.exports = { check_inbox };
