/// <reference types="Cypress" />

describe("Email assertion:", () => {
  it("Look for an email with specific subject and link in email body", function() {
    // debugger; //Uncomment for debugger to work...
    cy.task("gmail:get-messages", {
      options: {
        include_body: true
      }
    }).then(emails => {
      const found_email = emails.find(email => {
        return (
          email.from.indexOf("AccountSupport@ubi.com") >= 0 &&
          email.subject.indexOf("Ubisoft Password Change Request") >= 0
        );
      });
      assert.isNotNull(found_email, "Found email!");
      const body = found_email.body.html;
      assert.isTrue(
        body.indexOf(
          "https://account-uplay.ubi.com/en-GB/action/change-password?genomeid="
        ) >= 0,
        "Found reset link!"
      );
    });
  });
});
