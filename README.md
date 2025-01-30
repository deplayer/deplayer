# deplayer

[![pipeline status](https://gitlab.com/deplayer/deplayer/badges/master/pipeline.svg)](https://gitlab.com/deplayer/deplayer/commits/master)

## Open deplayer

[Official application is deployed here](https://deplayer.app/) but you can
self-host your own.

Since this is a local-first application, you can install it in your own device
and use it without internet connection. All your database is safely stored in
your browser, so you don't need to worry about your data being used by
third-parties.

## What is deplayer?

Play your music and videos entirely from your browser.
Connect your providers and start playing.
Deplayer aims to be a generic media player allowing you to manage your own
collection as you wish and play it from any device.

## Media providers

- System folders access througt [File System Access
  API](https://wicg.github.io/file-system-access/) (It will fall back to open
  files if your browser doesn't support this API)
- Webtorrent magnet links and .torrent files support. (Supports magnet links
  and .torrent files)
- Subsonic API
- iTunes API (it has only samples, usefull for testing)
- youtube-dl-server: Add youtube videos to your collection. You'll need to
  deploy your own server.
- Realtime sharing of current playing media and ask for download.
- Multi theme support.

## Features

- Progressive Web App, you can install it in your phone or as a desktop app.
- Desktop and mobile notifications thanks to [Notification Web
  API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [Media Session
  API](https://developers.google.com/web/updates/2017/02/media-session)
  implemented, control your player from your keyboard media keys or show media
  controls in your mobile.
- Local first. Your data is stored in your browser using PGLite and you can sync it with
  your remote database (Work in progress).
- Multi provider, add your data sources and listen the music from there. Keep
  reading to see the list of available providers.
- Lyrics support, using https://api.lyrics.ovh/v1
- Awesome visuals thanks to [butterchurn](https://github.com/jberg/butterchurn)
- Spectum audio visual thanks to [react-audio-spectrum](https://github.com/hu-ke/react-audio-spectrum)

## Keyboard hotkeys

| Command           | Hotkey               |
| ----------------- | -------------------- |
| Play/Pause        | `space`              |
| Next track        | `Arrow right` or `j` |
| Prev track        | `Arrow left` or `k`  |
| Open command bar  | `Control + k`        |

## Installing

```bash
npm install
```

## Running dev mode

```bash
npm run dev
```

## Testing the app

```bash
npm run test
```

## License

MIT
