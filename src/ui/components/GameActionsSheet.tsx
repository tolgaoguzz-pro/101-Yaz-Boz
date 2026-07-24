import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { chrome, colors, layout, radii, spacing, typography } from '../theme';

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
                pressed && chrome.pressed,
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
                pressed && chrome.pressed,
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
                pressed && chrome.pressed,
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
                pressed && chrome.pressed,
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
    backgroundColor: 'rgba(23, 74, 46, 0.72)',
    justifyContent: 'flex-end',
  },
  safe: {
    width: '100%',
  },
  sheet: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.creamCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  action: {
    minHeight: layout.buttonHeight,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dangerAction: {
    borderColor: colors.gold,
    backgroundColor: colors.creamHeader,
  },
  actionLabel: {
    ...typography.buttonSecondary,
    color: colors.green,
  },
  dangerLabel: {
    color: colors.greenDeep,
  },
  cancel: {
    minHeight: layout.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    ...typography.buttonGhost,
  },
});
