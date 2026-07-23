import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppTextField } from '../components/AppTextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { PLAYER_IDS } from '../gameRoster';
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';

type NewGameScreenProps = {
  onBack: () => void;
  onStart: (game: ActiveGameData) => void;
};

type GameSetupForm = {
  team1Name: string;
  player1Name: string;
  player2Name: string;
  team2Name: string;
  player3Name: string;
  player4Name: string;
};

const INITIAL_FORM: GameSetupForm = {
  team1Name: 'Takım 1',
  player1Name: 'Oyuncu 1',
  player2Name: 'Oyuncu 2',
  team2Name: 'Takım 2',
  player3Name: 'Oyuncu 3',
  player4Name: 'Oyuncu 4',
};

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function NewGameScreen({ onBack, onStart }: NewGameScreenProps) {
  const [form, setForm] = useState<GameSetupForm>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof GameSetupForm>(
    key: K,
    value: GameSetupForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError(null);
    }
  }

  function handleStart() {
    const values = Object.values(form);
    if (values.some(isBlank)) {
      setError('Tüm takım ve oyuncu adlarını doldurmalısın.');
      return;
    }

    const game: ActiveGameData = {
      roundNumber: 1,
      rounds: [],
      teams: [
        {
          name: form.team1Name.trim(),
          totalScore: 0,
          players: [
            {
              id: PLAYER_IDS.player1,
              name: form.player1Name.trim(),
              totalScore: 0,
            },
            {
              id: PLAYER_IDS.player2,
              name: form.player2Name.trim(),
              totalScore: 0,
            },
          ],
        },
        {
          name: form.team2Name.trim(),
          totalScore: 0,
          players: [
            {
              id: PLAYER_IDS.player3,
              name: form.player3Name.trim(),
              totalScore: 0,
            },
            {
              id: PLAYER_IDS.player4,
              name: form.player4Name.trim(),
              totalScore: 0,
            },
          ],
        },
      ],
    };

    onStart(game);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backPressed,
            ]}
          >
            <Text style={styles.backLabel}>Geri</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Yeni Oyun</Text>
            <Text style={styles.subtitle}>
              Takımları ve oyuncuları belirle, masayı kur.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Takım 1</Text>
            <AppTextField
              label="Takım adı"
              value={form.team1Name}
              onChangeText={(value) => updateField('team1Name', value)}
            />
            <AppTextField
              label="Oyuncu 1"
              value={form.player1Name}
              onChangeText={(value) => updateField('player1Name', value)}
            />
            <AppTextField
              label="Oyuncu 2"
              value={form.player2Name}
              onChangeText={(value) => updateField('player2Name', value)}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Takım 2</Text>
            <AppTextField
              label="Takım adı"
              value={form.team2Name}
              onChangeText={(value) => updateField('team2Name', value)}
            />
            <AppTextField
              label="Oyuncu 3"
              value={form.player3Name}
              onChangeText={(value) => updateField('player3Name', value)}
            />
            <AppTextField
              label="Oyuncu 4"
              value={form.player4Name}
              onChangeText={(value) => updateField('player4Name', value)}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton label="Oyunu Başlat" onPress={handleStart} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  backPressed: {
    backgroundColor: colors.surface,
  },
  backLabel: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  error: {
    ...typography.body,
    color: '#8B2E2E',
    backgroundColor: '#F3D9D4',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
});
