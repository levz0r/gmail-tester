const gmail = require('../gmail');
const gmailTester = require('../gmail-tester');

describe('Gmail Tester', () => {

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(gmail, 'authorize').and.returnValue(Promise.resolve({}));
  });

  // Issue #127: partial options used to drop the wait defaults and poll forever
  describe('check_inbox option defaults (issue #127)', () => {
    let delays;

    beforeEach(() => {
      delays = [];
      spyOn(global, 'setTimeout').and.callFake((fn, ms) => { delays.push(ms); fn(); });
      spyOn(gmail, 'get_recent_email').and.returnValue(Promise.resolve([]));
    });

    it('stops after the default max wait when only filters are passed', async () => {
      const result = await gmailTester.check_inbox('cred_path', 'token_path', { to: 'user@example.com' });

      expect(result).toBeNull();
      expect(gmail.get_recent_email).toHaveBeenCalledTimes(1);
    });

    it('uses the default poll interval when only max_wait_time_sec is passed', async () => {
      await gmailTester.check_inbox('cred_path', 'token_path', { to: 'user@example.com', max_wait_time_sec: 90 });

      expect(gmail.get_recent_email).toHaveBeenCalledTimes(3);
      expect(delays).toEqual([30000, 30000]);
    });

    it('ignores options explicitly set to undefined', async () => {
      await gmailTester.check_inbox('cred_path', 'token_path', { wait_time_sec: undefined, max_wait_time_sec: undefined });

      expect(gmail.get_recent_email).toHaveBeenCalledTimes(1);
    });

    it('keeps the default INBOX label', async () => {
      await gmailTester.check_inbox('cred_path', 'token_path', { to: 'user@example.com' });

      expect(gmail.get_recent_email).toHaveBeenCalledWith({}, 'to:"user@example.com"', 'INBOX');
    });
  });

  // Issue #102: errors used to be swallowed, resolving to undefined
  it('get_messages rejects when fetching fails', async () => {
    spyOn(gmail, 'get_recent_email').and.returnValue(Promise.reject(new Error('Login Required.')));

    await expectAsync(gmailTester.get_messages('cred_path', 'token_path', {})).toBeRejectedWithError('Login Required.');
  });

});
