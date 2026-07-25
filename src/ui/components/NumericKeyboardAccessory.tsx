import { useEffect, useRef, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

/**
 * Sabit aksesuar kimliği kökü.
 * Fabric (RN New Architecture) aynı nativeID'yi yalnızca ilk TextInput'a bağlar;
 * bu yüzden her alan için `${NUMERIC_INPUT_ACCESSORY_ID}-${index}` çifti kullanılır
 * (inputAccessoryViewID === nativeID).
 */
export const NUMERIC_INPUT_ACCESSORY_ID = 'yazboz-numeric-input-accessory';

export function numericAccessoryId(index: number): string {
  return `${NUMERIC_INPUT_ACCESSORY_ID}-${index}`;
}

const TOOLBAR_HEIGHT = 44;

const palette = {
  background: '#F4F6F4',
  border: '#D6DDD7',
  text: '#14533F',
} as const;

/** Ortak sayısal TextInput props (ID bind() ile verilir). */
export const numericTextInputProps: Pick<
  TextInputProps,
  | 'editable'
  | 'keyboardType'
  | 'inputMode'
  | 'showSoftInputOnFocus'
  | 'selectTextOnFocus'
  | 'pointerEvents'
> = {
  editable: true,
  keyboardType: 'number-pad',
  inputMode: 'numeric',
  showSoftInputOnFocus: true,
  selectTextOnFocus: true,
  pointerEvents: 'auto',
};

type AccessoryHandlers = {
  canPrev: boolean;
  canNext: boolean;
  goPrev: () => void;
  goNext: () => void;
  dismiss: () => void;
};

const noop = () => undefined;

let accessoryHandlers: AccessoryHandlers = {
  canPrev: false,
  canNext: false,
  goPrev: noop,
  goNext: noop,
  dismiss: () => {
    Keyboard.dismiss();
  },
};

const accessoryListeners = new Set<() => void>();

function publishAccessoryHandlers(next: AccessoryHandlers) {
  accessoryHandlers = next;
  accessoryListeners.forEach((listener) => listener());
}

function useAccessoryHandlers(): AccessoryHandlers {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => {
      setTick((value) => value + 1);
    };
    accessoryListeners.add(listener);
    return () => {
      accessoryListeners.delete(listener);
    };
  }, []);

  return accessoryHandlers;
}

export type NumericKeyboardBind = {
  ref: (node: TextInput | null) => void;
  onFocus: () => void;
  inputAccessoryViewID: string | undefined;
};

/**
 * Görünür sayısal input zinciri.
 * fieldCount yalnızca ekranda görünen number-pad alanlarını içermelidir.
 */
export function useNumericKeyboard(fieldCount: number) {
  const refs = useRef<(TextInput | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const activeIndexRef = useRef<number | null>(null);
  const fieldCountRef = useRef(fieldCount);
  activeIndexRef.current = activeIndex;
  fieldCountRef.current = fieldCount;

  useEffect(() => {
    refs.current.length = fieldCount;
    if (activeIndex !== null && activeIndex >= fieldCount) {
      setActiveIndex(null);
    }
  }, [fieldCount, activeIndex]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
      if (Platform.OS === 'android') {
        setKeyboardHeight(event.endCoordinates.height);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      setActiveIndex(null);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function goPrev() {
    const index = activeIndexRef.current;
    if (index === null || index <= 0) {
      return;
    }
    refs.current[index - 1]?.focus();
  }

  function goNext() {
    const index = activeIndexRef.current;
    const count = fieldCountRef.current;
    if (index === null || index >= count - 1) {
      return;
    }
    refs.current[index + 1]?.focus();
  }

  function dismiss() {
    const index = activeIndexRef.current;
    if (index !== null) {
      refs.current[index]?.blur();
    }
    Keyboard.dismiss();
    setActiveIndex(null);
  }

  const canPrev = activeIndex !== null && activeIndex > 0;
  const canNext =
    activeIndex !== null && fieldCount > 0 && activeIndex < fieldCount - 1;

  useEffect(() => {
    publishAccessoryHandlers({
      canPrev,
      canNext,
      goPrev,
      goNext,
      dismiss,
    });
  }, [canPrev, canNext, activeIndex, fieldCount]);

  useEffect(() => {
    return () => {
      publishAccessoryHandlers({
        canPrev: false,
        canNext: false,
        goPrev: noop,
        goNext: noop,
        dismiss: () => {
          Keyboard.dismiss();
        },
      });
    };
  }, []);

  function bind(index: number): NumericKeyboardBind {
    return {
      ref: (node: TextInput | null) => {
        refs.current[index] = node;
      },
      onFocus: () => {
        setActiveIndex(index);
      },
      // Her TextInput kendi InputAccessoryView nativeID'si ile birebir eşleşir.
      inputAccessoryViewID:
        Platform.OS === 'ios' ? numericAccessoryId(index) : undefined,
    };
  }

  const showAndroidDock =
    Platform.OS === 'android' && keyboardVisible && activeIndex !== null;

  return {
    bind,
    goPrev,
    goNext,
    dismiss,
    canPrev,
    canNext,
    activeIndex,
    keyboardVisible,
    keyboardHeight,
    showAndroidDock,
    fieldCount,
  };
}

function AccessoryToolbar() {
  const { canPrev, canNext, goPrev, goNext, dismiss } = useAccessoryHandlers();

  return (
    <View style={styles.bar} accessibilityRole="toolbar">
      <View style={styles.slot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Önceki"
          disabled={!canPrev}
          onPress={goPrev}
          style={({ pressed }) => [
            styles.button,
            !canPrev && styles.disabled,
            pressed && canPrev && styles.pressed,
          ]}
        >
          <Text style={styles.label} numberOfLines={1} allowFontScaling={false}>
            ‹ Önceki
          </Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.slot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sonraki"
          disabled={!canNext}
          onPress={goNext}
          style={({ pressed }) => [
            styles.button,
            !canNext && styles.disabled,
            pressed && canNext && styles.pressed,
          ]}
        >
          <Text style={styles.label} numberOfLines={1} allowFontScaling={false}>
            Sonraki ›
          </Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.slot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          disabled={false}
          onPress={dismiss}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.label} numberOfLines={1} allowFontScaling={false}>
            Kapat
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type NumericKeyboardAccessoryProps = {
  /** Görünür numeric alan sayısı — her alan için bir InputAccessoryView. */
  fieldCount: number;
};

/**
 * iOS native InputAccessoryView.
 * Fabric'te paylaşılan tek nativeID yalnızca ilk TextInput'a bağlandığı için
 * her alan için nativeID === inputAccessoryViewID çifti render edilir.
 */
export function NumericKeyboardAccessory({
  fieldCount,
}: NumericKeyboardAccessoryProps) {
  if (Platform.OS !== 'ios' || fieldCount <= 0) {
    return null;
  }

  return (
    <>
      {Array.from({ length: fieldCount }, (_, index) => {
        const id = numericAccessoryId(index);
        return (
          <InputAccessoryView
            key={id}
            nativeID={id}
            backgroundColor={palette.background}
          >
            <AccessoryToolbar />
          </InputAccessoryView>
        );
      })}
    </>
  );
}

type AndroidDockProps = {
  visible: boolean;
  keyboardHeight: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDismiss: () => void;
};

/** Yalnızca Android fallback. */
export function NumericKeyboardAndroidDock({
  visible,
  keyboardHeight,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onDismiss,
}: AndroidDockProps) {
  if (Platform.OS !== 'android' || !visible || keyboardHeight <= 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.androidDock, { bottom: keyboardHeight }]}
    >
      <View style={styles.bar} accessibilityRole="toolbar">
        <View style={styles.slot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Önceki"
            disabled={!canPrev}
            onPress={onPrev}
            style={({ pressed }) => [
              styles.button,
              !canPrev && styles.disabled,
              pressed && canPrev && styles.pressed,
            ]}
          >
            <Text
              style={styles.label}
              numberOfLines={1}
              allowFontScaling={false}
            >
              ‹ Önceki
            </Text>
          </Pressable>
        </View>
        <View style={styles.divider} />
        <View style={styles.slot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sonraki"
            disabled={!canNext}
            onPress={onNext}
            style={({ pressed }) => [
              styles.button,
              !canNext && styles.disabled,
              pressed && canNext && styles.pressed,
            ]}
          >
            <Text
              style={styles.label}
              numberOfLines={1}
              allowFontScaling={false}
            >
              Sonraki ›
            </Text>
          </Pressable>
        </View>
        <View style={styles.divider} />
        <View style={styles.slot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            disabled={false}
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={styles.label}
              numberOfLines={1}
              allowFontScaling={false}
            >
              Kapat
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  androidDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
  },
  bar: {
    height: TOOLBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  slot: {
    flex: 1,
    minWidth: 0,
    height: TOOLBAR_HEIGHT,
  },
  button: {
    flex: 1,
    height: TOOLBAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  divider: {
    width: 1,
    height: TOOLBAR_HEIGHT,
    backgroundColor: palette.border,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  disabled: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.82,
  },
});
