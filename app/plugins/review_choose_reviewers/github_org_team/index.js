import _ from 'lodash';
import github from 'app/core/github/api';

/**
 * Gets github team id from org name and team name.
 *
 * @param {String} org - Github organisation name
 * @param {String} team - Github organization's team name (slug).
 *
 * @returns {Promise}
 */
function getTeamId(org, team) {
    return new Promise((resolve, reject) => {
        github.api.orgs.getTeams({ org, per_page: 100 }, function (err, res) {
            if (err) reject(err);

            var repoTeam = _(res).filter({ slug: team }).first();

            if (!repoTeam) reject(`Team ${team} for org ${org} not found.`);

            resolve(repoTeam.id);
        });
    });
}

/**
 * Gets list of team members by team id.
 *
 * @param {Number} id - team id
 *
 * @returns {Promise}
 */
function getTeamMembers(id) {
    return new Promise((resolve, reject) => {
        github.api.orgs.getTeamMembers({ id, per_page: 100 }, function (err, res) {
            if (err) reject(err);

            resolve(res);
        });
    });
}

/**
 * Adds rank property to every team member.
 *
 * @param {Array} team
 *
 * @returns {Array}
 */
function addRank(team) {
    return team.map((member) => {
        member.rank = 0;

        return member;
    });
}

export default function reviewGithubOrgTeamCreator(options) {
    /**
     * Gets team for review from github repo organization.
     *
     * @param {Object} review
     *
     * @returns {Promise}
     */
    return function reviewGithubOrgTeam(review) {
        var opts = options[review.pull.head.repo.full_name];

        return getTeamId(opts.org, opts.team)
            .then(getTeamMembers)
            .then(addRank)
            .then(function (team) {
                review.team = team;
                return review;
            });
    };
}