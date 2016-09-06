import React, { PropTypes, Component } from 'react';
import { Link } from 'react-router';

class UserList extends Component {

  render() {
    return (
      <ul>
        {this.props.users.map((user) => {
          return (
            <li key={user.id}>
              <Link to={'user/' + user.id}>{user.name}</Link>
            </li>
          );
        })}
      </ul>
    );
  }
}

UserList.propTypes = {
  users: PropTypes.array.isRequired
};

export default UserList;
