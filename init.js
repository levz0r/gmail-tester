const gmail = require("./gmail-tester");

(async () => {
  if (process.argv.length < 5) {
    console.error(`Usage: init.js <path-to-credentials.json> <path-to-token.json> <target-email>`)
    process.exit(1)
  }
  await gmail.check_inbox(process.argv[2], process.argv[3], {
    subject: "",
    from: "",
    to: process.argv[4]
  });
})();
