import StaticTeam from '../static';

describe('services/team-static/static', () => {

  it('should return team members', done => {
    const members = [{ login: 'a' }, { login: 'b' }];
    const team = new StaticTeam(members);

    team.getTeam()
      .then(result => {
        assert.notEqual(result, members);
        assert.deepEqual(result, members);
        done();
      })
      .catch(done);
  });

  it('should return clone of members', done => {
    const members = [{ login: 'a' }, { login: 'b' }];
    const team = new StaticTeam(members);

    team.getTeam()
      .then(result => {
        assert.notEqual(result, members);
        done();
      })
      .catch(done);
  });

  it('should throws error if members not given', function () {
    const createTeam = function () {
      return new StaticTeam();
    };

    assert.throws(createTeam);
  });

  it('should throws error if members is an empty array', function () {
    const createTeam = function () {
      return new StaticTeam([]);
    };

    assert.throws(createTeam);
  });


});
