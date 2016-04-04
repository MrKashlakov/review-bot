import util from 'util';
import { find, reject } from 'lodash';

const EVENT_NAME = 'review:command:replace';

export function getParticipant(command, parseLogins) {
  const participant = parseLogins(command, ['/replace']);

  return participant[0];
}

export default function commandService(options, imports) {
  const { action, review, logger, events, parseLogins } = imports;

  /**
   * Handle '/replace' command.
   *
   * @param {String} command - line with user command
   * @param {Object} payload - github webhook payload.
   *
   * @return {Promise}
   */
  const replaceCommand = function replaceCommand(command, payload) {

    const pullRequest = payload.pullRequest;

    logger.info(
      '"/replace" [%s – %s] %s',
      pullRequest.number,
      pullRequest.title,
      pullRequest.html_url
    );

    if (pullRequest.state !== 'open') {
      return Promise.reject(new Error(util.format(
        'Cannot change reviewer for closed pull request [%s – %s] %s',
        pullRequest.number,
        pullRequest.title,
        pullRequest.html_url
      )));
    }

    const login = getParticipant(command, parseLogins);
    const reviewer = find(pullRequest.review.reviewers, { login });

    if (!reviewer) {
      return Promise.reject(new Error(util.format(
        '%s tried to change reviewer, but he is not in reviewers list [%s – %s] %s',
        login, pullRequest.number, pullRequest.title, pullRequest.html_url
      )));
    }

    return review.review(pullRequest.id)
      .then(result => {
        const candidate = result.team[0];
        const reviewers = reject(pullRequest.review.reviewers, { login });

        reviewers.push(candidate);

        return action.updateReviewers(reviewers, pullRequest.id);
      })
      .then(pullRequest => {
        events.emit(EVENT_NAME, { pullRequest });
      });
  };

  return replaceCommand;
}
