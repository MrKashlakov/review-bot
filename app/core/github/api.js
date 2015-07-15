var _ = require('lodash');
var GitHub = require('github');
var logger = require('app/core/logger');
var PullRequest = require('app/core/models').get('PullRequest');

var start;
var end;

var github = {
    api: {},

    /**
     * Init github api wrapper.
     *
     * @param {Object} options
     *
     * @returns {this}
     */
    init: function init(options) {
        var api = new GitHub(options);
        api.authenticate(options.authenticate);

        start = options.content.start;
        end = options.content.end;

        this.api = api;

        return this;
    },

    /**
     * Adds content to pull request body.
     *
     * @param {Number} pullId
     * @param {String} id - unique content id.
     * @param {String} content - any content which will be placed in pull request body.
     *
     * @returns {Promise}
     */
    setBodyContent: function setBodyContent(pullId, id, content) {
        var _this = this;

        return PullRequest
            .findById(pullId)
            .then(function (pullRequest) {
                if (!pullRequest) return Promise.reject(new Error('PullRequest not found'));

                pullRequest.extra_body = pullRequest.extra_body || {};
                pullRequest.extra_body[id] = content;

                return pullRequest.save();
            })
            .then(function (pullRequest) {
                _this._updatePullRequestBody(pullRequest);

                return pullRequest;
            }, logger.error.bind(logger, 'core/github/api#setBodyContent: '));
    },

    /**
     * Requests info for given pull request from github api.
     *
     * @param {Object} pullRequest
     *
     * @returns {Promise}
     */
    getPullRequestInfo: function getPullRequestInfo(pullRequest) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            _this.api.pullRequests.get({
                user: pullRequest.org,
                repo: pullRequest.repo,
                number: pullRequest.number
            }, function (err, pullRequestInfo) {
                if (err) return reject(err);

                resolve(pullRequestInfo);
            });
        });
    },

    /**
     * Saves pull request info.
     *
     * @param {Object} pullRequestInfo
     *
     * @returns {Promise}
     */
    savePullRequestInfo: function savePullRequestInfo(pullRequestInfo) {
        return new Promise(function (resolve, reject) {
            PullRequest
                .findById(pullRequestInfo.id)
                .then(function (pullRequest) {
                    pullRequest.set(pullRequestInfo);

                    pullRequest.save(function (err, pullRequest) {
                        if (err) return reject(err);

                        resolve(pullRequest);
                    });
                });
        });
    },

    /**
     * Loads pull request info and updates it in mongo.
     *
     * @param {Object} pullRequest
     *
     * @returns {Promise}
     */
    updatePullRequestInfo: function updatePullRequestInfo(pullRequest) {
        return this.getPullRequestInfo(pullRequest)
            .then(this.savePullRequestInfo)
            .catch(logger.error.bind(logger, 'core/github/api#updatePullRequestInfo: '));
    },

    /**
     * Updates pull request body with extra body content.
     * @private
     *
     * @param {Object} pullRequest
     */
    _updatePullRequestBody: function _updatePullRequestBody(pullRequest) {
        var _this = this;

        var extraBody = start + Object.keys(pullRequest.extra_body).map(function (key) {
            return '<div>' + pullRequest.extra_body[key] + '</div>';
        }) + end;

        this
            .updatePullRequestInfo(pullRequest)
            .then(function (pullRequest) {
                _this._updateBody(pullRequest, extraBody);
            })
            .catch(logger.error.bind(logger, 'core/github/api#_updatePullRequestBody: '));
    },

    /**
     * Sends github api request to update body of pull request.
     * @private
     *
     * @param {Object} pullRequest
     * @param {String} extraBody
     */
    _updateBody: function _updateBody(pullRequest, extraBody) {
        this.api.pullRequests.update({
            user: pullRequest.org,
            repo: pullRequest.repo,
            number: pullRequest.number,
            title: pullRequest.title,
            body: pullRequest.body + extraBody
        }, function (err) {
            if (err) {
                logger.error('core/github/api#_updateBody: ', err);
            }
        });
    }
};

github._updatePullRequestBody = _.debounce(github._updatePullRequestBody.bind(github), 2000);

module.exports = github;
