# genar-radio

* [Online version](http://genar-radio.surge.sh/)

Media player thought to run entirelly in the web browser.

## Current features

* Progressive Web App
* Fulltext search support thanks to [elasticlunr](https://elasticlunr.com/).
* Desktop and mobile notifications thanks to [Notification Web API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
* Spectum audio visual thanks to [react-audio-spectrum](https://github.com/hu-ke/react-audio-spectrum)
* Import/Export your collection (thanks to [rxdb][rxdb]), allowing to share your collection between machines.

## Music providers

* Subsonic API
* mStream API
* iTunes API (it has only samples, usefull for testing)

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

## Libraries used

* axios
* [rxdb][rxdb]
* react + redux
* react-router
* react-redux-i18n
* redux-saga
* bootstrap
* react-simple-share
* react-key-handler

[rxdb]: https://rxdb.info
