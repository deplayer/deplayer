# genar-radio

[![pipeline status](https://gitlab.com/gtrias/genar-radio/badges/master/pipeline.svg)](https://gitlab.com/gtrias/genar-radio/commits/master)

* [Online version](http://genar-radio.surge.sh/)

Media player thought to run entirelly in the web browser.

## Features

* Progressive Web App
* Fulltext search support thanks to [elasticlunr](https://elasticlunr.com/).
* Desktop and mobile notifications thanks to [Notification Web API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
* Spectum audio visual thanks to [react-audio-spectrum](https://github.com/hu-ke/react-audio-spectrum)
* Import/Export your collection (thanks to [rxdb][rxdb]), allowing to share your collection between machines.
* Sync with your remote [pouchdb](https://pouchdb.com/) / [couchdb](https://couchdb.apache.org/) your database as a backup and share your collection and session between devices and browsers!

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
