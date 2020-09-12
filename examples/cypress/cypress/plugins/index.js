// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/// <reference types="Cypress" />
const debug = require("debug");
const path = require("path");
const gmail_tester = require("../../../../gmail-tester");

module.exports = (on, config) => {
  on("before:browser:launch", (browser = {}, launchOptions) => {
    // `args` is an array of all the arguments that will
    // be passed to browsers when it launches
    console.log(launchOptions.args); // print all current args
    if (browser.family === "chromium" && browser.name !== "electron") {
      // auto open devtools
      launchOptions.args.push("--auto-open-devtools-for-tabs");
      // allow remote debugging
      // launchOptions.args.push("--remote-debugging-port=9221");
      // whatever you return here becomes the launchOptions
    } else if (browser.family === "firefox") {
      // auto open devtools
      launchOptions.args.push("-devtools");
    }
    return launchOptions;
  });
  on("task", {
    "gmail:get-messages": async args => {
      const messages = await gmail_tester.get_messages(
        path.resolve(__dirname, "credentials.json"),
        path.resolve(__dirname, "token.json"),
        args.options
      );
      return messages;
    },
    "gmail:check-inbox": async args => {
      const messages = await gmail_tester.check_inbox(
        path.resolve(__dirname, "credentials.json"),
        path.resolve(__dirname, "token.json"),
        args.options
      );
      return messages;
    }
  });
};
