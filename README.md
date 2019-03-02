# gmail-tester
A simple NodeJS gmail client which checks the inbox for specific message existance.
It works on any gmail-powered account (both private and company).
`gmail-tester` is polling the mailbox for a given amount of time and either returns the desired message, or quits if the message is not found within the given time.

# Usage
1. Install using `npm`: 
```
npm install --save-dev gmail-tester
```
2. Save the Google Cloud Platform OAuth2 Authentication file named `credentials.json` inside an accessible directory (see instructions below). 
3. In terminal, run the following command:
```
node <node_modules>/gmail-tester/init.js <path-to-credentials.json> <target-email>
```
The script will prompt you to go to google.com to activate a token. Go to the given link, and select the account for `<target-email>`. Grand the permission to view your email messages and settings. In the end of the process you should see the token:
<p align="center">
  <img src="https://i.ibb.co/sJm97H1/copy-token.png" alt="copy-token" border="0">
</p>

Hit the copy button and paste it to `init.js` script.
The process should look like this:
<p align="center">
  <img src="https://i.ibb.co/HKSRp3k/run-script.png" alt="Run script">
</p>

# How to get credentials.json?
1. Follow the instructions to [Create a client ID and client secret](https://developers.google.com/adwords/api/docs/guides/authentication#create_a_client_id_and_client_secret).
2. Once done, go to [https://console.cloud.google.com/apis/credentials?project=(project-name)&folder&organizationId](https://console.cloud.google.com/apis/credentials?project=(project-name)&folder&organizationId) and download the OAuth2 credentials file, like shown in the image below. Make sure to replace `(project-name)` with your project name.
<p align="center">
  <img src="https://i.ibb.co/z5FL6YK/get-credentials-json.png" alt="Get credentials.json">
</p>

The `credentials.json` file should look like this:
<p align="center">
  <img src="https://i.ibb.co/1stgn28/credentials.png" alt="Credentials file">
</p>

3. Congratulations! `gmail-tester` is ready to use.

# Example
```javascript
const path = require("path");
const gmail = require("gmail-tester");
const email = await gmail.check_inbox(
    path.resolve(__dirname, "credentials.json"),  // Assuming credentials.json is in the same directory where the example is.
    "Activate Your Account",                      // We are looking for 'Activate Your Account' in the subject of the message.
    "no-reply@domain.com",                        // We are looking for a sender header which has 'no-reply@domain.com' in it.
    "<target-email>",                             // Which inbox to poll. credentials.json should contain the credentials to it.
    10,                                           // Poll interval (in seconds).
    30                                            // Maximum poll time (in seconds), after which we'll giveup.
  );
if (email) {
  console.log('Email was found!');
} else {
  console.log('Email was not found!');
}
```
