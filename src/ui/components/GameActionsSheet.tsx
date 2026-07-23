import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

type GameActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPause: () => void;
  onFinishEarly: () => void;
  onAbandon: () => void;
};

export function GameActionsSheet({
  visible,
  onClose,
  onPause,
  onFinishEarly,
  onAbandon,
}: GameActionsSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <SafeAreaView style={styles.safe}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.title}>Oyun İşlemleri</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                onPause();
              }}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={styles.actionLabel}>Oyunu Durdur</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                onFinishEarly();
              }}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={styles.actionLabel}>Oyunu Bitir</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                onAbandon();
              }}
              style={({ pressed }) => [
                styles.action,
                styles.dangerAction,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={[styles.actionLabel, styles.dangerLabel]}>
                Oyunu İptal Et
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancel,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={styles.cancelLabel}>Vazgeç</Text>
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 26, 0.55)',
    justifyContent: 'flex-end',
  },
  safe: {
    width: '100%',
  },
  sheet: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  action: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dangerAction: {
    borderColor: '#D4A8A8',
    backgroundColor: '#F7E8E6',
  },
  actionPressed: {
    opacity: 0.88,
  },
  actionLabel: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  dangerLabel: {
    color: '#8B2E2E',
  },
  cancel: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    ...typography.buttonSecondary,
    color: colors.textSecondary,
  },
});
