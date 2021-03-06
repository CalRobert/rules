'use strict';

const nock = require('nock');

const loadRule = require('../utils/load-rule');
const ContextBuilder = require('../utils/contextBuilder');
const RequestBuilder = require('../utils/requestBuilder');

const ruleName = 'send-events-keenio';

describe(ruleName, () => {
  let context;
  let rule;
  let alert;
  const stubs = {
    'slack-notify': function(webhook) {
      expect(webhook).toEqual('YOUR SLACK WEBHOOK URL');
      return { alert };
    }
  };

  beforeEach(() => {
    rule = loadRule(ruleName, {}, stubs);
  });

  describe('should do nothing', () => {
    beforeEach(() => {
      const request = new RequestBuilder().build();
      context = new ContextBuilder()
        .withRequest(request)
        .build();
    });

    it('if login count is more than 1', (done) => {
      rule({}, context, (err, u, c) => {
        expect(err).toBeFalsy();
        expect(c).toEqual(context);

        done();
      });
    });
  });

  describe('should post userdata to keen', () => {
    beforeEach(() => {
      const request = new RequestBuilder().build();
      context = new ContextBuilder()
        .withRequest(request)
        .build();

      context.stats.loginsCount = 1;
    });

    it('if it is first login', (done) => {
      const user = {
        user_id: 'uid1',
        name: 'Terrified Duck'
      };

      nock('https://api.keen.io')
        .post('/3.0/projects/YOUR%20KEEN%20IO%20PROJECT%20ID/events/signups?api_key=YOUR%20KEEN%20IO%20WRITE%20KEY', function(body) {
          expect(body.userId).toEqual(user.user_id);
          expect(body.name).toEqual(user.name);
          expect(body.ip).toEqual(context.request.ip);

          return true;
        })
        .reply(200);

      rule(user, context, (err, u, c) => {
        expect(err).toBeFalsy();
        expect(c).toEqual(context);

        done();
      });
    });

    it('and send slack report in case of error', (done) => {
      alert = function(options) {
        expect(options.channel).toEqual('#some_channel');
        expect(options.text).toEqual('KEEN API ERROR');
        expect(options.fields.error).toEqual('Error: test error');

        done();
      };

      nock('https://api.keen.io')
        .post('/3.0/projects/YOUR%20KEEN%20IO%20PROJECT%20ID/events/signups?api_key=YOUR%20KEEN%20IO%20WRITE%20KEY', function() {
          return true;
        })
        .replyWithError(new Error('test error'));

      rule({}, context, (err, u, c) => {
        expect(err).toBeFalsy();
        expect(c).toEqual(context);
      });
    });
  });
});
