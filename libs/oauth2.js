// Copyright 2012 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const http = require("http");
const url = require("url");
const opn = require("open");

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
const keyPath = path.join(__dirname, "secret.json");
let keys = { redirect_uris: [""] };
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /?code=<code>&state=<state>
 */
async function authenticate(oauth2Client, scopes, tokensFile, port = 32019) {
  return new Promise((resolve, reject) => {
    const redirectUri = `http://localhost:${port}`;
    // Random state ties the callback to this flow, so a forged request can't inject someone else's code
    const state = crypto.randomBytes(32).toString("hex");
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes.join(" "),
      redirect_uri: redirectUri,
      state
    });
    console.log(`Authorize this app by visiting this url: ${authorizeUrl}`);
    const server = http
      .createServer(async (req, res) => {
        const qs = new url.URL(req.url, redirectUri).searchParams;
        if (qs.get("state") !== state) {
          // Ignore unrelated requests (favicon, stray or forged callbacks) and keep waiting
          res.statusCode = 400;
          res.end("Invalid OAuth state.");
          return;
        }
        if (qs.get("error")) {
          res.end("Authentication failed. Please return to the console.");
          closeServer();
          reject(new Error(`OAuth authorization failed: ${qs.get("error")}`));
          return;
        }
        res.end("Authentication successful! Please return to the console.");
        closeServer();
        try {
          const { tokens } = await oauth2Client.getToken({
            code: qs.get("code"),
            redirect_uri: redirectUri
          });
          // The caller persists the tokens via token-store
          oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
          resolve(oauth2Client);
        } catch (e) {
          reject(e);
        }
      })
      // Loopback only: don't expose the callback to the network
      .listen(port, "localhost", () => {
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, { wait: false }).then(cp => cp.unref());
      });
    server.on("error", reject);
    const closeServer = () => {
      server.close();
      server.closeAllConnections();
    };
  });
}

module.exports = { authenticate };
