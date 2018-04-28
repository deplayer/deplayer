import React, { Component } from 'react';

export default class Track extends Component {
  render() {
    return (
      <div>
        { this.props.track }
      </div>
    )
  }
}
