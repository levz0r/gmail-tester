const gmail = require("./gmail");

(async () => {
  if (process.argv.length < 5) {
    console.error(`Usage: init.js <path-to-credentials.json> <path-to-token.json> <target-email> [port]`)
    console.error(`  port: Optional. Default is 32019. Set a custom port if needed.`)
    process.exit(1)
  }
  const port = process.argv[5] ? parseInt(process.argv[5], 10) : 32019;
  console.log(`[gmail] Sign in as ${process.argv[4]} when the browser opens...`);
  // Only authorize: authorize() runs the OAuth flow if needed and saves the token
  await gmail.authorize(process.argv[2], process.argv[3], port);
  console.log(`[gmail] Token ready at ${process.argv[3]}. You're all set!`);
})().catch(err => {
  console.error("[gmail] Error:", err.message || err);
  process.exit(1);
});
