import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

type GameActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPause: () => void;
  onFinishEarly: () => void;
  onAbandon: () => void;
};

type Density = 'normal' | 'compact' | 'ultraCompact';

function resolveDensity(height: number): Density {
  if (height < 700) return 'ultraCompact';
  if (height < 800) return 'compact';
  return 'normal';
}

function PauseIcon({ size, color }: { size: number; color: string }) {
  const barW = Math.max(3, Math.round(size * 0.14));
  const barH = Math.round(size * 0.42);
  return (
    <View style={[iconStyles.pauseRow, { width: size * 0.45, height: barH }]}>
      <View
        style={{
          width: barW,
          height: barH,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: barW,
          height: barH,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function FinishIcon({ size, color }: { size: number; color: string }) {
  const poleW = Math.max(2, Math.round(size * 0.08));
  const poleH = Math.round(size * 0.48);
  const flagW = Math.round(size * 0.34);
  const flagH = Math.round(size * 0.22);
  return (
    <View style={[iconStyles.finishRow, { height: poleH }]}>
      <View
        style={{
          width: poleW,
          height: poleH,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: flagW,
          height: flagH,
          marginLeft: 1,
          backgroundColor: color,
          borderTopRightRadius: 2,
          borderBottomRightRadius: 2,
        }}
      />
    </View>
  );
}

function CancelIcon({ size, color }: { size: number; color: string }) {
  const arm = Math.round(size * 0.36);
  const thickness = Math.max(2, Math.round(size * 0.08));
  return (
    <View style={[iconStyles.cancelBox, { width: arm, height: arm }]}>
      <View
        style={[
          iconStyles.cancelArm,
          {
            width: arm,
            height: thickness,
            backgroundColor: color,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      <View
        style={[
          iconStyles.cancelArm,
          {
            width: arm,
            height: thickness,
            backgroundColor: color,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
    </View>
  );
}

function Chevron({ color }: { color: string }) {
  return (
    <View
      style={[
        iconStyles.chevron,
        {
          borderColor: color,
        },
      ]}
    />
  );
}

export function GameActionsSheet({
  visible,
  onClose,
  onPause,
  onFinishEarly,
  onAbandon,
}: GameActionsSheetProps) {
  const { height } = useWindowDimensions();
  const density = resolveDensity(height);
  const compact = density === 'compact';
  const ultra = density === 'ultraCompact';

  const sheetPadTop = compact || ultra ? 12 : 14;
  const titleSize = ultra ? 20 : compact ? 22 : 24;
  const titleLine = ultra ? 24 : compact ? 27 : 29;
  const rowMinH = ultra ? 58 : compact ? 64 : 72;
  const iconSize = ultra ? 34 : compact ? 38 : 42;
  const iconRadius = ultra ? 11 : compact ? 12 : 14;
  const rowMargin = ultra ? 7 : 10;
  const cancelH = ultra ? 44 : compact ? 48 : 52;

  const pauseSub = ultra
    ? 'Sonra kaldığın yerden devam et.'
    : 'Daha sonra kaldığın yerden devam et.';
  const finishSub = ultra
    ? 'Mevcut skorlarla erken tamamla.'
    : 'Mevcut skorlarla oyunu erken tamamla.';
  const abandonSub = ultra
    ? 'Oyun silinir, sonuçlara eklenmez.'
    : 'Oyun silinir ve sonuçlara eklenmez.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <SafeAreaView style={styles.safe}>
          <Pressable
            style={[styles.sheet, { paddingTop: sheetPadTop }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.handle} />

            <Text
              style={[
                styles.title,
                { fontSize: titleSize, lineHeight: titleLine },
              ]}
            >
              Oyun İşlemleri
            </Text>
            <Text style={styles.subtitle}>Oyun durumunu yönet</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Oyunu durdur"
              onPress={() => {
                onClose();
                onPause();
              }}
              style={({ pressed }) => [
                styles.row,
                styles.pauseRow,
                {
                  minHeight: rowMinH,
                  marginBottom: rowMargin,
                },
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  styles.pauseIconWrap,
                  {
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconRadius,
                  },
                ]}
              >
                <PauseIcon size={iconSize} color="#14533F" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.pauseTitle}>Oyunu Durdur</Text>
                <Text style={styles.pauseSub}>{pauseSub}</Text>
              </View>
              <Chevron color="rgba(23,67,51,0.35)" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Oyunu bitir"
              onPress={() => {
                onClose();
                onFinishEarly();
              }}
              style={({ pressed }) => [
                styles.row,
                styles.finishRow,
                {
                  minHeight: rowMinH,
                  marginBottom: rowMargin,
                },
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  styles.finishIconWrap,
                  {
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconRadius,
                  },
                ]}
              >
                <FinishIcon size={iconSize} color="#72531F" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.finishTitle}>Oyunu Bitir</Text>
                <Text style={styles.finishSub}>{finishSub}</Text>
              </View>
              <Chevron color="rgba(94,70,26,0.4)" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Oyunu iptal et"
              onPress={() => {
                onClose();
                onAbandon();
              }}
              style={({ pressed }) => [
                styles.row,
                styles.dangerRow,
                {
                  minHeight: rowMinH,
                  marginBottom: rowMargin,
                },
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  styles.dangerIconWrap,
                  {
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconRadius,
                  },
                ]}
              >
                <CancelIcon size={iconSize} color="#9A2D26" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.dangerTitle}>Oyunu İptal Et</Text>
                <Text style={styles.dangerSub}>{abandonSub}</Text>
              </View>
              <Chevron color="rgba(139,46,37,0.4)" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vazgeç"
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancel,
                { height: cancelH },
                pressed && styles.cancelPressed,
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

const iconStyles = StyleSheet.create({
  pauseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  finishRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cancelBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelArm: {
    position: 'absolute',
    borderRadius: 1,
  },
  chevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginLeft: 8,
  },
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,18,14,0.72)',
    justifyContent: 'flex-end',
  },
  safe: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#DCE7DF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderColor: '#B7CBBE',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(23,67,51,0.24)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontWeight: '900',
    color: '#174333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(23,67,51,0.58)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  row: {
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  pauseRow: {
    backgroundColor: '#EAF1EC',
    borderColor: '#B7CBBE',
  },
  finishRow: {
    backgroundColor: '#E8E1C8',
    borderColor: '#CDB97C',
  },
  dangerRow: {
    backgroundColor: '#F0D7D4',
    borderColor: '#D8A6A0',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pauseIconWrap: {
    backgroundColor: '#C9D8CF',
  },
  finishIconWrap: {
    backgroundColor: '#DDC98D',
  },
  dangerIconWrap: {
    backgroundColor: '#E6BBB6',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  pauseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#174333',
  },
  pauseSub: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(23,67,51,0.58)',
    marginTop: 2,
  },
  finishTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5E461A',
  },
  finishSub: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(94,70,26,0.66)',
    marginTop: 2,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B2E25',
  },
  dangerSub: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(139,46,37,0.68)',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.88,
  },
  cancel: {
    borderRadius: 16,
    backgroundColor: '#14533F',
    borderColor: '#14533F',
    borderWidth: 1,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressed: {
    opacity: 0.9,
  },
  cancelLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
