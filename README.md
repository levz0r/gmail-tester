<p align="center"><img alt="gmail-tester" src="https://user-images.githubusercontent.com/4564386/122464439-814de100-cfbf-11eb-9227-95a9cc3cc2f1.png" width="80%"/></p>

# gmail-tester

<span align="center">

[![npm version](https://badge.fury.io/js/gmail-tester.svg)](https://www.npmjs.com/package/gmail-tester)
<span class="badge-npmdownloads"><a href="https://npmjs.org/package/badges" title="View this project on NPM"><img src="https://img.shields.io/npm/dt/badges.svg" alt="NPM downloads" /></a></span>
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![GitHub stars](https://img.shields.io/github/stars/levz0r/gmail-tester?style=social)

</span>

A simple Node.js Gmail client which checks/returns email message(s) straight from any Gmail-powered account (both private and company).<br/>
There are two main functionalities this library provides:<br>

1.  `check_inbox()`: Polls a mailbox for a given amount of time. At the end of the operation, the desired message is returned (if found).
2.  `get_messages()`: Can be used to perform various assertions on the email objects (see example [below](https://github.com/levz0r/gmail-tester/blob/master/README.md#using-get_messages-to-assert-email-body-using-cypress)).

P.S, I have written a [story](https://medium.com/@levz0r/how-to-poll-a-gmail-inbox-in-cypress-io-a4286cfdb888) on medium, how using [Cypress](https://cypress.io), we are testing our user registration process at Tastewise.

# Upgrading to 2.0

- **Node.js 22 or newer is required.** Cypress runs `setupNodeEvents` on your system Node, so check `node -v` there too.
- The full `googleapis` SDK (~120 MB) was replaced by `@googleapis/gmail` (~1 MB), so installs are much faster. The API is unchanged and no code changes are needed.
- Existing `credentials.json` and `token.json` files keep working.

If you're stuck on Node 20 or older, pin `gmail-tester@^1.5.0`.

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
`[port]` Optional. The local port for the OAuth redirect. Default: `32019`.

The script opens your browser on Google's consent page (the link is also printed in the terminal). Select the account for `<target-email>` and grant permission to view your email messages. Google then redirects to `http://localhost:32019`, the script saves the token and exits. There is no code to copy and paste.

If the script keeps waiting after you grant permission, the redirect didn't reach it. Check that `http://localhost:<port>` is an authorized redirect URI for your OAuth client, and run `init.js` on the same machine as the browser.

When it's done, the script prints:

> [gmail] Token ready at <path-to-token.json>. You're all set!

# How to get credentials.json?

1.  In the [Google Cloud Console](https://console.cloud.google.com/), create a project or select an existing one.
2.  [Enable the Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com) for the project.
3.  **Configure the consent screen** in [Google Auth Platform](https://console.cloud.google.com/auth/overview). Choose **External** for a personal Gmail account.
    - While the app is in **Testing** mode, only accounts listed under **Audience → Test users** can sign in. Add the Gmail accounts you want to test with.
    - Refresh tokens for apps in Testing mode expire after 7 days. For long-lived CI tokens, publish the app (verification isn't required for personal use).
4.  **Create an OAuth client** under [Clients](https://console.cloud.google.com/auth/clients):
    - **Desktop app** (recommended): works as-is. Google allows any `http://localhost` port for Desktop clients.
    - **Web application** also works, but you must add `http://localhost:32019` (or `http://localhost:<your-port>`) under **Authorized redirect URIs**.
5.  Download the client's JSON and save it as `credentials.json`. Desktop clients have an `installed` key at the top level and Web clients have `web`. Both are supported.

⛔️ **Never share or commit `credentials.json` nor `token.json`!!! Whoever has it will have full access to your inbox!**

# API

### `get_messages(credentials, token, options, port = 32019)`

`credentials`: Path to credentials JSON file or JSON Object.<br>
`token`: Path to OAuth2 token file or JSON Object.<br>
`port`: Optional. Local port for the OAuth redirect if a new token is needed. Default: `32019`.<br>
`options`: <br>

- `from`: String. Filter on the email address of the receiver.
- `to`: String. Filter on the email address of the sender.
- `subject`: String. Filter on the subject of the email.
- `include_body`: boolean. Set to `true` to fetch decoded email bodies.
- `include_attachments`: boolean. Set to `true` to fetch the base64-encoded email attachments.
- `before`: Date. Filter messages received _before_ the specified date.
- `after`: Date. Filter messages received _after_ the specified date.
- `label`: String. The default label is 'INBOX', but can be changed to 'SPAM', 'TRASH' or a custom label. For a full list of built-in labels, see https://developers.google.com/gmail/api/guides/labels?hl=en

**Returns:**
A promise of an array of `email` objects (empty if nothing matches). It rejects if Gmail can't be reached or authorization fails. Before 1.5.0 it resolved to `undefined` in that case.<br>
The `email` objects have the following fields:<br>

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

### `check_inbox(credentials, token, options = {}, port = 32019)`

`credentials`: Path to credentials JSON file or JSON Object.<br>
`token`: Path to OAuth2 token file or JSON Object.<br>
`port`: Optional. Local port for the OAuth redirect if a new token is needed. Default: `32019`.<br>
`options`: <br>

- `from`: String. Filter on the email address of the receiver.
- `to`: String. Filter on the email address of the sender.
- `subject`: String. Filter on the subject of the email.
- `include_body`: boolean. Set to `true` to fetch decoded email bodies.
- `include_attachments`: boolean. Set to `true` to fetch the base64-encoded email attachments.
- `before`: Date. Filter messages received _before_ the specified date.
- `after`: Date. Filter messages received _after_ the specified date.
- `wait_time_sec`: Integer. Interval between inbox checks (in seconds). _Default: 30 seconds_.
- `max_wait_time_sec`: Integer. Maximum wait time (in seconds). When reached and the email was not found, the script exits. _Default: 30 seconds_.
- `label`: String. The default label is 'INBOX', but can be changed to 'SPAM', 'TRASH' or a custom label. For a full list of built-in labels, see https://developers.google.com/gmail/api/guides/labels?hl=en


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

In addition, verbose messages will be written to console.

### `refresh_access_token(credentials, token, port = 32019)`

`credentials`: Path to credentials JSON file or JSON Object.<br>
`token`: Path to OAuth2 token file or JSON Object.<br>

Refresh the access token. A new file will overwrite the existing one in `token_path`.

# Example

## Using `check_inbox()` to look for a specific message:

```javascript
const path = require("path");
const gmail = require("gmail-tester");
const email = await gmail.check_inbox(
  path.resolve(__dirname, "credentials.json"), // Assuming credentials.json is in the current directory.
  path.resolve(__dirname, "gmail_token.json"), // Look for gmail_token.json in the current directory (if it doesn't exists, it will be created by the script).
  {
    subject: "Activate Your Account", // We are looking for 'Activate Your Account' in the subject of the message.
    from: "no-reply@domain.com", // We are looking for a sender header which is 'no-reply@domain.com'.
    to: "<target-email>", // Which inbox to poll. credentials.json should contain the credentials to it.
    wait_time_sec: 10, // Poll interval (in seconds).
    max_wait_time_sec: 30, // Maximum poll time (in seconds), after which we'll giveup.
    include_body: true
  }
);
if (email) {
  console.log("Email was found!");
} else {
  console.log("Email was not found!");
}
```

## Using `get_messages()` to assert email body using Cypress

_[cypress.config.js](https://github.com/levz0r/cypress-gmail-tester/blob/main/cypress.config.js):_

```javascript
const { defineConfig } = require("cypress");
const gmailTester = require("gmail-tester");
const path = require("path");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        "gmail:get-messages": async (args) => {
          const messages = await gmailTester.get_messages(
            path.resolve(__dirname, "credentials.json"),
            path.resolve(__dirname, "token.json"),
            args.options
          );
          return messages;
        },
      });
    },
  },
});
```

_[spec.cy.js](https://github.com/levz0r/cypress-gmail-tester/blob/main/cypress/e2e/spec.cy.js):_

```javascript
/// <reference types="Cypress" />

describe("Email assertion:", () => {
  it("Using gmail_tester.get_messages(), look for an email with specific subject and link in email body", function () {
    // debugger; //Uncomment for debugger to work...
    cy.task("gmail:get-messages", {
      options: {
        from: "AccountSupport@ubi.com",
        subject: "Ubisoft Password Change Request",
        include_body: true,
        before: new Date(2019, 8, 24, 12, 31, 13), // Before September 24rd, 2019 12:31:13
        after: new Date(2019, 7, 23), // After August 23, 2019
      },
    }).then((emails) => {
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

# Contributors

<a href="https://github.com/levz0r/gmail-tester/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=levz0r/gmail-tester" />
</a>

Please feel free to contribute to this project.

# Credits

- Built using [googleapis](https://github.com/googleapis/googleapis).
