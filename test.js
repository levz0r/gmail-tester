const gmail_tester = require("./gmail-tester");

(async () => {
  const inbox = await gmail_tester.check_inbox("credentials.json", "token.json", {
    subject: "TSLA: Tesla: Ignore",
    from: "",
    to: "",
    wait_time_sec: 10,
    max_wait_time_sec: 40,
    include_body: true
  });

  const msgs = await gmail_tester.get_messages("credentials.json", "token.json", {
    subject: "TSLA: Tesla: Ignore",
    from: "",
    to: "",
    include_body: true
  });
})();
