import React, { Component } from 'react';

export default class Player extends Component {
  render() {
    const track = "https://raw.githubusercontent.com/captbaritone/webamp/master/mp3/llama-2.91.mp3"
    return (
      <audio src={track} controls />
    )
  }
}
