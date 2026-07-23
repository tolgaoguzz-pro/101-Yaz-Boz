import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ScoreSheetCell,
  ScoreSheetModel,
  ScoreSheetRow,
  paginateScoreSheetRows,
  scoreSheetPageLabel,
} from '../scoreSheet';
import { colors, radii, spacing, typography } from '../theme';

type ScoreSheetTableProps = {
  sheet: ScoreSheetModel;
  pageIndex: number;
  onPageChange: (pageIndex: number) => void;
  targetRoundCount?: number;
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
}: {
  row: ScoreSheetRow;
  isHeader?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
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
  pageIndex,
  onPageChange,
  targetRoundCount,
}: ScoreSheetTableProps) {
  const { pageRows, totalRow, pageIndex: safePage, pageCount } =
    paginateScoreSheetRows(sheet, pageIndex);

  const headerRow: ScoreSheetRow = {
    id: 'header',
    label: 'El',
    kind: 'round',
    cells: sheet.playerNames.map((name) => ({
      kind: 'value',
      text: name,
    })),
  };

  return (
    <View style={styles.frame}>
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

      <SheetRowView row={headerRow} isHeader />

      {pageRows.length === 0 ? (
        <Text style={styles.empty}>Henüz el yok</Text>
      ) : (
        pageRows.map((row) => (
          <View key={row.id}>
            <SheetRowView row={row} />
            {row.detail ? (
              <Text style={styles.detail} numberOfLines={1}>
                {row.detail}
              </Text>
            ) : null}
          </View>
        ))
      )}

      {totalRow ? <SheetRowView row={totalRow} /> : null}

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

      <View style={styles.pager}>
        <Pressable
          accessibilityRole="button"
          disabled={safePage <= 0}
          onPress={() => onPageChange(safePage - 1)}
          style={[styles.pagerBtn, safePage <= 0 && styles.pagerDisabled]}
        >
          <Text style={styles.pagerLabel}>‹</Text>
        </Pressable>
        <Text style={styles.pagerMeta}>
          {scoreSheetPageLabel(safePage, pageCount, targetRoundCount)}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={safePage >= pageCount - 1}
          onPress={() => onPageChange(safePage + 1)}
          style={[
            styles.pagerBtn,
            safePage >= pageCount - 1 && styles.pagerDisabled,
          ]}
        >
          <Text style={styles.pagerLabel}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    gap: 2,
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
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    marginTop: 2,
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
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  teamTotalLine: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryMuted,
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  pagerBtn: {
    minWidth: 40,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  pagerDisabled: {
    opacity: 0.35,
  },
  pagerLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  pagerMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
