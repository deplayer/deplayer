# deplayer

[![pipeline status](https://gitlab.com/deplayer/deplayer/badges/master/pipeline.svg)](https://gitlab.com/deplayer/deplayer/commits/master)

* [Online version](http://deplayer.surge.sh/)
* [Hosted on IPFS](http://deplayer.eth.link/) - [zil domain](http://deplayer.zil/)

Play your music and videos entirely from your browser.
Connect your providers and start playing.
Deplayer aims to be a generic browser allowing you to manage your own
collection as you wish and play it from any device.

It's tech stack is based in:

* React
* redux
* redux-sagas
* react-player

## Features

* Progressive Web App, you can install it in your phone or as a desktop app.
* Fulltext search support thanks to [elasticlunr](https://elasticlunr.com/).
* Desktop and mobile notifications thanks to [Notification Web
  API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
* [Media Session
  API](https://developers.google.com/web/updates/2017/02/media-session)
  implemented, control your player from your keyboard media keys or show media
  controls in your mobile.
* Import/Export your collection (th), allowing to share
  your collection between machines.
* Offline first, sync with your remote  [pouchdb](https://pouchdb.com/) /
  [couchdb](https://couchdb.apache.org/) your database as a backup and share
  your collection and session between devices and browsers!
* Multi provider, add your data sources and listen the music from there. Keep
  reading to see the list of available providers.
* **BETA** Supports scanning IPFS folder and importing music, analysing its id3.
* **WORK IN PROGRESS** Spectum audio visual thanks to
  [react-audio-spectrum](https://github.com/hu-ke/react-audio-spectrum)
  tags.

## Implemented Music providers

* **BETA** IPFS folder
* Subsonic API
* mStream API
* iTunes API (it has only samples, usefull for testing)
* youtube-dl-server: Add youtube videos to your collection. You'll need to
  deploy your own server.

## Implemented artists metadata providers

* last.fm (not very usefull)

## Keyboard hotkeys

* Play/Pause: `space`
* Next track: `Arrow right` or `j`
* Prev track: `Arrow left` or `k`
* Focus on search: `/`

## Installing

```bash
yarn
```

## Testing the app

```bash
yarn test
```

## Running dev environment

```bash
yarn start
```

## Run storybook

```bash
yarn storybook
```
