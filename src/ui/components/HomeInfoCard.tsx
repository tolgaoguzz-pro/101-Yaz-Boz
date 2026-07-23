import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

const INFO_ITEMS = ['4 Oyuncu', '2 Takım', 'Otomatik Puan'] as const;

export function HomeInfoCard() {
  return (
    <View style={styles.card}>
      {INFO_ITEMS.map((item, index) => (
        <View
          key={item}
          style={[styles.item, index < INFO_ITEMS.length - 1 && styles.itemGap]}
        >
          <View style={styles.dot} />
          <Text style={styles.label}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemGap: {},
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
  },
  label: {
    ...typography.infoLabel,
    color: colors.text,
  },
});
