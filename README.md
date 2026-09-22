# expo-video: cached HLS can't play offline when ABR picks an uncached rendition (Android)

A minimal reproduction for expo-video on Android, built from a blank SDK 57 app with stock `expo-video`.

## The bug

With `useCaching: true`, ExoPlayer only caches the HLS renditions its adaptive bitrate (ABR) logic actually fetched while online. It starts on a low rendition and climbs. Offline, ABR may open on a rendition that isn't in the cache. When the request for it fails with `UnknownHostException`, Media3's default `LoadErrorHandlingPolicy` doesn't try another track. That policy only falls back on HTTP 403/404/410/416/500/503. So playback errors out even though another rendition of the same stream is cached.

## Steps

1. `npm install`, then `npx expo run:android --variant release`. A release build keeps Metro out of it, so the app runs with no network.
2. **Online:** tap **Play 1** and let it play for about 10 s, then tap **Play 2** and let it play for about 10 s. The on-screen "video cache on disk" value grows.
3. Turn on **airplane mode** (Wi-Fi and mobile data off).
4. Force-stop the app, open it again, and tap **Play 1** / **Play 2**.

**Expected:** the stream plays from the cache, using the rendition that was cached.

**Actual:** `status: error`, and logcat shows

```
E/ExoPlayerImplInternal: Playback error
E/ExoPlayerImplInternal:   UnknownHostException (no network)
```

The cache still holds the segments (the cache size shown on screen is unchanged).

## Environment

- Expo SDK 57, `expo-video` ~57.0.4 (Media3 1.9.0)
- Found on a Neon Smarta 2 (Android 14 Go, Unisoc SC9832E). It affects any device, because the failure is in the track fallback policy, not the hardware.

## Fix

Treat transport failures (`UnknownHostException`, `ConnectException`) as a track fallback when `useCaching` is on. See the linked PR in expo/expo.

Note for anyone patching this locally: SDK 57 ships expo-video **precompiled** on Android. A `patch-package` edit to its Kotlin does nothing unless `expo-video` is listed in `expo.autolinking.android.buildFromSource` in package.json, and the build succeeds either way, so nothing tells you the patch wasn't applied.
