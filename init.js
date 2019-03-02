const gmail = require("./gmail-tester");

(async () => {
  await gmail.check_inbox(process.argv[2], "", "", "");
})();
