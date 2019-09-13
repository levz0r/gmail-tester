# gmail-tester

[![npm version](https://badge.fury.io/js/gmail-tester.svg)](https://www.npmjs.com/package/gmail-tester)
<span class="badge-npmdownloads"><a href="https://npmjs.org/package/badges" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/badges.svg" alt="NPM downloads" /></a></span>
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A simple Node.js Gmail client which checks/returns email message(s) straight from any Gmail-powered account (both private and company).<br/>
There are two main functionalities this library provides:<br>

1.  `check_inbox()`: Polls a mailbox for a given amount of time. At the end of the operation, the desired message is returned (if found).
2.  `get_messages()`: Can be used to perform various assertions on the email objects (see example [below](https://github.com/levz0r/gmail-tester/blob/master/README.md#using-get_messages-to-assert-email-body-using-cypress)).

P.S, I have written a [story](https://medium.com/@levz0r/how-to-poll-a-gmail-inbox-in-cypress-io-a4286cfdb888) on medium, how using [Cypress](https://cypress.io), we are testing our user registration process at Tastewise.

# Usage

1.  Install using `npm`:

```
npm install --save-dev gmail-tester
```

2.  Save the Google Cloud Platform OAuth2 Authentication file named `credentials.json` inside an accessible directory (see instructions [below](https://github.com/levz0r/gmail-tester/blob/master/README.md#how-to-get-credentialsjson)).
3.  In terminal, run the following command:

```
node <node_modules>/gmail-tester/init.js <path-to-credentials.json> <path-to-token.json> <target-email>
```

`<path-to-credentials.json>` Is the path to OAuth2 Authentication file.<br/>
`<path-to-token.json>` Is the path to OAuth2 token. If it doesn't exist, the script will create it.<br/>
The script will prompt you to go to google.com to activate a token.
Go to the given link, and select the account for `<target-email>`. Grant permission to view your email messages and settings. At the end of the process you should see the token:

<p align="center">
  <img src="https://i.ibb.co/sJm97H1/copy-token.png" alt="copy-token" border="0">
</p>

Hit the copy button and paste it to `init.js` script.
The process should look like this:

<p align="center">
  <img src="https://i.ibb.co/k94bkzB/run-script.png" alt="Run script">
</p>

# How to get credentials.json?

1.  Follow the instructions to [Create a client ID and client secret](https://developers.google.com/adwords/api/docs/guides/authentication#create_a_client_id_and_client_secret).
2.  Once done, go to [https://console.cloud.google.com/apis/credentials?project=(project-name)&folder&organizationId](<https://console.cloud.google.com/apis/credentials?project=(project-name)&folder&organizationId>) and download the OAuth2 credentials file, as shown in the image below. Make sure to replace `(project-name)` with your project name.
    <p align="center">
      <img src="https://i.ibb.co/z5FL6YK/get-credentials-json.png" alt="Get credentials.json">
    </p>

The `credentials.json` file should look like this:

<p align="center">
  <img src="https://i.ibb.co/1stgn28/credentials.png" alt="Credentials file">
</p>

If everything is done right, the last output from the script should be

> [gmail] Found!

3.  Congratulations! `gmail-tester` is ready to use.

# API

### `get_messages(credentials_json, token_path, options)`

`credentials_json`: Path to credentials JSON file.<br>
`token_path`: Path to OAuth2 token file.<br>
`options`: <br>

* `from`: String. Filter on the email address of the receiver.
* `to`: String. Filter on the email address of the sender.
* `subject`: String. Filter on the subject of the email.
* `include_body`: boolean. Set to `true` to fetch decoded email bodies.
* `before`: Date. Filter messages received _after_ the specified date.
* `after`: Date. Filter messages received _before_ the specified date.

**Returns:**
An array of `email` objects with the following fields:<br>

```javascript
[
  {
    from: "Human Friendly Name <sender@email-address>",
    receiver: "your@email-address",
    subject: "string",
    body: {
      html: "string",
      text: "string"
    }
  }
  // ...
];
```

_Some senders will send you `text/html` content, the others will send you `plain/text`, and some will send you both. Make sure you are looking for the content in the right body field._

# Example

## Using `check_inbox()` to look for a specific message:

```javascript
const path = require("path");
const gmail = require("gmail-tester");
const email = await gmail.check_inbox(
  path.resolve(__dirname, "credentials.json"), // Assuming credentials.json is in the current directory.
  path.resolve(__dirname, "gmail_token.json"), // Look for gmail_token.json in the current directory (if it doesn't exists, it will be created by the script).
  "Activate Your Account", // We are looking for 'Activate Your Account' in the subject of the message.
  "no-reply@domain.com", // We are looking for a sender header which has 'no-reply@domain.com' in it.
  "<target-email>", // Which inbox to poll. credentials.json should contain the credentials to it.
  10, // Poll interval (in seconds).
  30 // Maximum poll time (in seconds), after which we'll giveup.
);
if (email) {
  console.log("Email was found!");
} else {
  console.log("Email was not found!");
}
```

## Using `get_messages()` to assert email body using Cypress

_[examples\cypress\plugins\index.js](https://github.com/levz0r/gmail-tester/blob/master/examples/cypress/plugins/index.js):_

```javascript
/// <reference types="Cypress" />
const debug = require("debug");
const path = require("path");
const gmail_tester = require("../../../../../gmail-tester");

module.exports = (on, config) => {
  on("before:browser:launch", (browser = {}, args) => {
    if (browser.name === "chrome") {
      args.push("--remote-debugging-port=9221");
      return args;
    }
  });
  on("task", {
    "gmail:get-messages": async args => {
      const messages = await gmail_tester.get_messages(
        path.resolve(__dirname, "credentials.json"),
        path.resolve(__dirname, "token.json"),
        args.options
      );
      return messages;
    }
  });
};
```

_[examples\cypress\integration\gmail.spec.js](https://github.com/levz0r/gmail-tester/blob/master/examples/cypress/integration/gmail.spec.js):_

```javascript
/// <reference types="Cypress" />

describe("Email assertion:", () => {
  it("Look for an email with specific subject and link in email body", function() {
    // debugger; //Uncomment for debugger to work...
    cy
      .task("gmail:get-messages", {
        options: {
          from: "AccountSupport@ubi.com",
          subject: "Ubisoft Password Change Request",
          include_body: true,
          before: new Date(2019, 8, 24, 12, 31, 13), // Before September 24rd, 2019 12:31:13
          after: new Date(2019, 7, 23) // After August 23, 2019
        }
      })
      .then(emails => {
        assert.isAtLeast(
          emails.length,
          1,
          "Expected to find at least one email, but none were found!"
        );
        const body = emails[0].body.html;
        assert.isTrue(
          body.indexOf(
            "https://account-uplay.ubi.com/en-GB/action/change-password?genomeid="
          ) >= 0,
          "Found reset link!"
        );
      });
  });
});
```

# Contributing

Please feel free to contribute to this project.

# Credits

* Built using [googleapis](https://github.com/googleapis/googleapis).
