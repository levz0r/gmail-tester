const gmail = require("./gmail-tester");

(async () => {
  if (process.argv.length < 5) {
    console.error(`Usage: init.js <path-to-credentials.json> <path-to-token.json> <target-email> [port]`)
    console.error(`  port: Optional. Default is 32019. Set a custom port if needed.`)
    process.exit(1)
  }
  const port = process.argv[5] ? parseInt(process.argv[5], 10) : 32019;
  await gmail.check_inbox(process.argv[2], process.argv[3], {
    subject: "",
    from: "",
    to: process.argv[4]
  }, port);
})();
