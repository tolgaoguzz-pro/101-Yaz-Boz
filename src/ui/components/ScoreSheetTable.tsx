import { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  ScoreSheetCell,
  ScoreSheetModel,
  ScoreSheetRow,
  didActivityRowCountIncrease,
  getScoreSheetBodyRows,
  getScoreSheetTotalRow,
} from '../scoreSheet';
import { colors, radii, spacing, typography } from '../theme';

type ScoreSheetTableProps = {
  sheet: ScoreSheetModel;
  compact?: boolean;
};

function CellText({ cell }: { cell: ScoreSheetCell }) {
  if (cell.kind === 'dash') {
    return <Text style={styles.dash}>—</Text>;
  }
  if (cell.kind === 'empty') {
    return <Text style={styles.dash}> </Text>;
  }
  return (
    <Text style={[styles.cellValue, cell.emphasize && styles.cellEmphasize]}>
      {cell.text}
    </Text>
  );
}

function SheetRowView({
  row,
  isHeader,
  compact,
}: {
  row: ScoreSheetRow;
  isHeader?: boolean;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        row.kind === 'penalty' && styles.penaltyRow,
        row.kind === 'total' && styles.totalRow,
        isHeader && styles.headerRow,
      ]}
    >
      <Text
        style={[styles.labelCell, isHeader && styles.headerLabel]}
        numberOfLines={1}
      >
        {row.label}
      </Text>
      {row.cells.map((cell, index) => (
        <View key={`${row.id}-${index}`} style={styles.valueCell}>
          <CellText cell={cell} />
        </View>
      ))}
    </View>
  );
}

export function ScoreSheetTable({
  sheet,
  compact = false,
}: ScoreSheetTableProps) {
  const { height } = useWindowDimensions();
  const bodyRows = getScoreSheetBodyRows(sheet);
  const totalRow = getScoreSheetTotalRow(sheet);
  const scrollRef = useRef<ScrollView>(null);
  const previousCountRef = useRef<number | null>(null);
  const stickToEndRef = useRef(true);
  const animateStickRef = useRef(false);

  const headerRow: ScoreSheetRow = {
    id: 'header',
    label: 'El',
    kind: 'round',
    cells: sheet.playerNames.map((name) => ({
      kind: 'value',
      text: name,
    })),
  };

  // Küçük ekranda gövde için daha sıkı minimum; flex ile kalan alanı doldurur.
  const bodyMinHeight = compact
    ? Math.max(120, Math.round(height * 0.22))
    : Math.max(160, Math.round(height * 0.28));

  useEffect(() => {
    const previous = previousCountRef.current;
    const next = sheet.activityRowCount;

    if (previous !== null && didActivityRowCountIncrease(previous, next)) {
      stickToEndRef.current = true;
      animateStickRef.current = true;
    }

    previousCountRef.current = next;
  }, [sheet.activityRowCount]);

  function handleContentSizeChange() {
    if (!stickToEndRef.current || sheet.activityRowCount === 0) {
      return;
    }
    scrollRef.current?.scrollToEnd({ animated: animateStickRef.current });
    stickToEndRef.current = false;
  }

  return (
    <View style={[styles.frame, compact && styles.frameCompact]}>
      <View style={styles.stickyHeader}>
        {sheet.gameMode === 'paired' && sheet.teamNames ? (
          <View style={styles.teamHeader}>
            <Text style={styles.teamHeaderLeft} numberOfLines={1}>
              {sheet.teamNames[0]}
            </Text>
            <Text style={styles.teamHeaderRight} numberOfLines={1}>
              {sheet.teamNames[1]}
            </Text>
          </View>
        ) : (
          <Text style={styles.soloTitle}>Bireysel Skor Tablosu</Text>
        )}
        <SheetRowView row={headerRow} isHeader compact={compact} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={[styles.bodyScroll, { minHeight: bodyMinHeight }]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={handleContentSizeChange}
      >
        {bodyRows.length === 0 ? (
          <Text style={styles.empty}>Henüz el yok</Text>
        ) : (
          bodyRows.map((row) => (
            <View key={row.id}>
              <SheetRowView row={row} compact={compact} />
              {row.detail ? (
                <Text style={styles.detail} numberOfLines={1}>
                  {row.detail}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.stickyFooter}>
        {totalRow ? (
          <SheetRowView row={totalRow} compact={compact} />
        ) : null}
        {sheet.gameMode === 'paired' && sheet.teamTotals && sheet.teamNames ? (
          <View style={styles.teamTotals}>
            <Text style={styles.teamTotalLine} numberOfLines={1}>
              {sheet.teamNames[0]}: {sheet.teamTotals[0]}
            </Text>
            <Text style={styles.teamTotalLine} numberOfLines={1}>
              {sheet.teamNames[1]}: {sheet.teamTotals[1]}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 0,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  frameCompact: {
    paddingVertical: 4,
  },
  stickyHeader: {
    gap: 2,
    paddingBottom: 2,
  },
  stickyFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    paddingTop: 2,
    gap: 2,
  },
  bodyScroll: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    flexGrow: 1,
    paddingBottom: 4,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: 4,
    gap: spacing.sm,
  },
  teamHeaderLeft: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'left',
  },
  teamHeaderRight: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
  },
  soloTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    paddingVertical: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowCompact: {
    minHeight: 24,
    paddingVertical: 1,
  },
  headerRow: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    borderRadius: radii.sm,
    minHeight: 32,
  },
  penaltyRow: {
    backgroundColor: '#F6E4D8',
  },
  totalRow: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
  },
  labelCell: {
    width: 44,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    paddingLeft: 4,
  },
  headerLabel: {
    color: colors.primary,
  },
  valueCell: {
    flex: 1,
    alignItems: 'center',
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  cellEmphasize: {
    fontWeight: '800',
    color: colors.primary,
  },
  dash: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detail: {
    fontSize: 11,
    color: colors.textSecondary,
    paddingLeft: 48,
    marginBottom: 2,
  },
  empty: {
    ...typography.infoLabel,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  teamTotals: {
    paddingTop: 2,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  teamTotalLine: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryMuted,
  },
});
