import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { pdfPublicUrl } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc, Note, Pdf, Video } from '@/lib/models';
import { Brand } from '@/lib/theme';

/** Videos / PDFs / Notes lists — used by the Study tab and topic/exam screens. */
export function MaterialSections({
  videos,
  pdfs,
  notes,
}: {
  videos: Video[];
  pdfs: Pdf[];
  notes: Note[];
}) {
  const router = useRouter();
  const { gu } = useLanguage();

  function premiumAlert() {
    Alert.alert(
      gu ? 'પ્રીમિયમ' : 'Premium',
      gu
        ? 'આ સામગ્રી પ્રીમિયમ સભ્યો માટે છે. ટૂંક સમયમાં આવી રહ્યું છે!'
        : 'This content is for premium members. Coming soon!'
    );
  }

  return (
    <>
      {videos.length > 0 && (
        <Section title={gu ? 'વિડિયો' : 'Videos'}>
          {videos.map((video) => (
            <Row
              key={video.id}
              icon="logo-youtube"
              iconColor="#FF0000"
              title={loc(gu, video.title_en, video.title_gu)}
              locked={video.is_premium}
              onPress={() =>
                video.is_premium
                  ? premiumAlert()
                  : Linking.openURL(`https://youtube.com/watch?v=${video.youtube_id}`)
              }
            />
          ))}
        </Section>
      )}
      {pdfs.length > 0 && (
        <Section title={gu ? 'PDF' : 'PDFs'}>
          {pdfs.map((pdf) => (
            <Row
              key={pdf.id}
              icon="document-text"
              iconColor={Brand.red}
              title={loc(gu, pdf.title_en, pdf.title_gu)}
              locked={pdf.is_premium}
              onPress={() =>
                pdf.is_premium ? premiumAlert() : Linking.openURL(pdfPublicUrl(pdf.storage_path))
              }
            />
          ))}
        </Section>
      )}
      {notes.length > 0 && (
        <Section title={gu ? 'નોટ્સ' : 'Notes'}>
          {notes.map((note) => (
            <Row
              key={note.id}
              icon="reader"
              iconColor={Brand.navy}
              title={loc(gu, note.title_en, note.title_gu)}
              locked={note.is_premium}
              onPress={() =>
                note.is_premium
                  ? premiumAlert()
                  : router.push({ pathname: '/note/[id]', params: { id: note.id } })
              }
            />
          ))}
        </Section>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  icon,
  iconColor,
  title,
  locked,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  title: string;
  locked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Ionicons name={icon} size={22} color={iconColor} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Ionicons
        name={locked ? 'lock-closed' : 'chevron-forward'}
        size={18}
        color={locked ? Brand.yellow : Brand.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginTop: 4 },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#222' },
});
