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

const fs = require("fs");
const path = require("path");
const http = require("http");
const url = require("url");
const opn = require("open");
const destroyer = require("server-destroy");

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
const keyPath = path.join(__dirname, "secret.json");
let keys = { redirect_uris: [""] };
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
 */
async function authenticate(oauth2Client, scopes, tokensFile) {
  return new Promise((resolve, reject) => {
    // grab the url that will be used for authorization
    if (!fs.existsSync(tokensFile)) {
      const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes.join(" ")
      });
      console.log(`Authorize this app by visiting this url: ${authorizeUrl}`);
      const server = http
        .createServer(async (req, res) => {
          try {
            if (req.url.indexOf("/") > -1) {
              const qs = new url.URL(req.url, "http://localhost:80").searchParams;
              res.end("Authentication successful! Please return to the console.");
              server.destroy();
              const { tokens } = await oauth2Client.getToken(qs.get("code"));
              fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2));
              oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
              resolve(oauth2Client);
            }
          } catch (e) {
            reject(e);
          }
        })
        .listen(80, () => {
          // open the browser to the authorize url to start the workflow
          opn(authorizeUrl, { wait: false }).then(cp => cp.unref());
        });
      destroyer(server);
    } else {
      oauth2Client.credentials = tokensFile; // eslint-disable-line require-atomic-updates
      resolve(oauth2Client);
    }
  });
}

module.exports = { authenticate };
