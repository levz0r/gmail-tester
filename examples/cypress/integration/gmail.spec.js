/// <reference types="Cypress" />

describe("Email assertion:", () => {
  it("Look for an email with specific subject and link in email body", function() {
    // debugger; //Uncomment for debugger to work...
    cy.task("gmail:get-messages", {
      options: {
        from: "AccountSupport@ubi.com",
        subject: "Ubisoft Password Change Request",
        include_body: true,
        before: new Date(2019, 8, 24, 12, 31, 13), // Before September 24rd, 2019 12:31:13
        after: new Date(2019, 7, 23) // After August 23, 2019
      }
    }).then(emails => {
      assert.isAtLeast(
        emails.length,
        1,
        "Expected to find at least one email, but none were found!"
      );
      const body = emails[0].body.html;
      assert.isTrue(
        body.indexOf(
          "https://account-uplay.ubi.com/en-GB/action/change-password?genomeid="
        ) >= 0,
        "Found reset link!"
      );
    });
  });
});
