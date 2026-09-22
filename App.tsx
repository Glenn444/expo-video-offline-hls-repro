import { useEvent } from 'expo';
import { getCurrentVideoCacheSize, useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Public multi-rendition HLS streams. Each master lists several renditions, so ExoPlayer's ABR
// chooses one; online it starts low and climbs, so the cache ends up holding only some renditions.
const STREAMS = [
  { name: 'Mux test (x36xhzz)', uri: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  {
    name: 'Apple bipbop (TS)',
    uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
  },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const player = useVideoPlayer({ uri: STREAMS[0]!.uri, useCaching: true }, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });

  const note = (line: string) => setLog((l) => [`${new Date().toLocaleTimeString()} ${line}`, ...l].slice(0, 12));

  const open = async (i: number) => {
    setIndex(i);
    note(`open ${STREAMS[i]!.name}`);
    await player.replaceAsync({ uri: STREAMS[i]!.uri, useCaching: true });
    player.play();
  };

  let cacheMb = '?';
  try {
    cacheMb = (getCurrentVideoCacheSize() / 1024 / 1024).toFixed(1);
  } catch {
    // not available yet
  }

  return (
    <View style={styles.root}>
      <VideoView player={player} style={styles.video} contentFit="contain" />
      <View style={styles.panel}>
        <Text style={styles.title}>{STREAMS[index]!.name}</Text>
        <Text testID="status" style={[styles.status, status === 'error' && styles.bad]}>
          status: {status}
          {error ? `\nerror: ${error.message}` : ''}
        </Text>
        <Text style={styles.meta}>video cache on disk: {cacheMb} MB</Text>
        <View style={styles.row}>
          {STREAMS.map((s, i) => (
            <Pressable key={s.uri} onPress={() => void open(i)} style={styles.button}>
              <Text style={styles.buttonText}>Play {i + 1}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView style={styles.log}>
          {log.map((l) => (
            <Text key={l} style={styles.logLine}>
              {l}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', paddingTop: 48 },
  video: { width: '100%', aspectRatio: 16 / 9 },
  panel: { flex: 1, padding: 16, gap: 8 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  status: { color: '#9f9', fontSize: 16 },
  bad: { color: '#f66' },
  meta: { color: '#ccc' },
  row: { flexDirection: 'row', gap: 12 },
  button: { backgroundColor: '#333', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  log: { flex: 1 },
  logLine: { color: '#aaa', fontSize: 12 },
});
