const gmail = require("./gmail-tester");

(async () => {
  await gmail.check_inbox(process.argv[2], process.argv[3], {
    subject: "",
    from: "",
    to: process.argv[4]
  });
})();
