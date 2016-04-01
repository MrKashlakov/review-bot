import { clone } from 'lodash';

import parseLogins from '../../parse-logins/parse-logins';

import service from '../commands/add';
import { getParticipant } from '../commands/add';
import { mockReviewers } from '../__mocks__/index';
import pullRequestActionMock from '../../pull-request-action/__mocks__/index';

describe('services/command/add', () => {

  describe('#getParticipant', () => {

    it('should get participant from command like /add @username', () => {
      assert.equal(getParticipant('/add @username', parseLogins), 'username');
      assert.equal(getParticipant('Text \n/add @username\nOther text', parseLogins), 'username');
      assert.equal(getParticipant(' /add @username and some more text\nOther text', parseLogins), 'username');
    });

    it('should get participant from command like /add username', () => {
      assert.equal(getParticipant('/add username', parseLogins), 'username');
      assert.equal(getParticipant('Text \n/add username\nOther text', parseLogins), 'username');
      assert.equal(getParticipant(' /add username and some more text\nOther text', parseLogins), 'username');
    });

    it('should get participant from command like +@username', () => {
      assert.equal(getParticipant('+@username', parseLogins), 'username');
      assert.equal(getParticipant('Text \n+@username\nOther text', parseLogins), 'username');
      assert.equal(getParticipant(' +@username and some more text\nOther text', parseLogins), 'username');
    });

    it('should get participant from command like +username', () => {
      assert.equal(getParticipant('+username', parseLogins), 'username');
      assert.equal(getParticipant('Text \n+username\nOther text', parseLogins), 'username');
      assert.equal(getParticipant(' +username and some more text\nOther text', parseLogins), 'username');
    });
  });

  describe('#addCommand', () => {
    let command, pullRequest, payload, action, events, logger, team, comment; // eslint-disable-line

    beforeEach(() => {
      team = {
        findTeamMemberByPullRequest: sinon.stub().returns(
          Promise.resolve({ login: 'Hawkeye' })
        )
      };
      action = pullRequestActionMock(pullRequest);
      events = { emit: sinon.stub() };
      logger = { info: sinon.stub() };
      comment = {
        user: {
          login: 'd4rkr00t'
        }
      };
      pullRequest = {
        id: 1,
        get: sinon.stub().returns(clone(mockReviewers))
      };

      command = service({}, { team, action, logger, events, parseLogins });
      payload = { pullRequest, comment };
    });

    it('should be rejected if user is already in reviewers list', done => {
      command('/add Hulk', payload).catch(() => done());
    });

    it('should be rejected if no such user in team', done => {
      team.findTeamMemberByPullRequest = sinon.stub().returns(Promise.resolve(null));

      command('/add Hulfk', payload).catch(() => done());
    });

    it('should save pullRequest with new reviewer', done => {
      command('/add Hawkeye', payload).then(() => {
        const resultReviewers = clone(mockReviewers);
        resultReviewers.push({ login: 'Hawkeye' });

        assert.called(action.updateReviewers);
        assert.deepEqual(pullRequest.get('review.reviewers'), resultReviewers);

        done();
      }, done);
    });

    it('should emit `review:command:add` event', done => {
      command('/add Hawkeye', payload).then(() => {
        assert.calledWith(events.emit, 'review:command:add');

        done();
      }, done);
    });

  });

});
