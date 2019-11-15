# decentraplayer

[![pipeline status](https://gitlab.com/decentraplayer/decentraplayer/badges/master/pipeline.svg)](https://gitlab.com/decentraplayer/decentraplayer/commits/master)

* [Online version](http://decentraplayer.surge.sh/)

Decentralized mediaplayer which runs entirely in the browser.

## Features

* Progressive Web App, you can install it in your phone or as a desktop app.
* Fulltext search support thanks to [elasticlunr](https://elasticlunr.com/).
* Desktop and mobile notifications thanks to [Notification Web API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
* [Media Session API](https://developers.google.com/web/updates/2017/02/media-session) implemented, control your player from your keyboard media keys or show media controls in your mobile.
* Spectum audio visual thanks to [react-audio-spectrum](https://github.com/hu-ke/react-audio-spectrum)
* Import/Export your collection (thanks to [rxdb][rxdb]), allowing to share your collection between machines.
* Offline first, sync with your remote [pouchdb](https://pouchdb.com/) / [couchdb](https://couchdb.apache.org/) your database as a backup and share your collection and session between devices and browsers!
* Multi provider, add your data sources and listen the music from there. Keep reading to see the list of available providers.

## Implemented Music providers

* IPFS folder (work-in-progress)
* Subsonic API
* mStream API
* iTunes API (it has only samples, usefull for testing)

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

[rxdb]: https://rxdb.info
