import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ScoreSheetCell,
  ScoreSheetModel,
  ScoreSheetRow,
  didActivityRowCountIncrease,
  getScoreSheetBodyRows,
  getScoreSheetTotalRow,
} from '../scoreSheet';
import { colors, layout, radii } from '../theme';

export type ScoreSheetSurface = {
  frame: string;
  header: string;
  row: string;
  rowAlt: string;
  total: string;
  teamTotals: string;
  grid: string;
  text: string;
  textMuted: string;
  accent: string;
  penalty: string;
};

const defaultSurface: ScoreSheetSurface = {
  frame: colors.cream,
  header: colors.creamHeader,
  row: colors.cream,
  rowAlt: colors.cream,
  total: colors.creamTotal,
  teamTotals: colors.creamCard,
  grid: colors.line,
  text: colors.text,
  textMuted: colors.textMuted,
  accent: colors.green,
  penalty: colors.penalty,
};

/** Aktif oyun paneli — krem/beyaz yok. */
export const activeMintSurface: ScoreSheetSurface = {
  frame: '#E8EFEA',
  header: '#CBDACF',
  row: '#E8EFEA',
  rowAlt: '#E2ECE5',
  total: '#CBDACF',
  teamTotals: '#C5D6CA',
  grid: 'rgba(23,67,51,0.16)',
  text: '#142D25',
  textMuted: 'rgba(20,45,37,0.55)',
  accent: '#17513D',
  penalty: '#D9E6D4',
};

type ScoreSheetTableProps = {
  model: ScoreSheetModel;
  compact?: boolean;
  bodyRowBoost?: number;
  emphasizeHeader?: boolean;
  surface?: ScoreSheetSurface;
};

function CellText({
  cell,
  isTotal,
  isHeader,
  compact,
  surface,
}: {
  cell: ScoreSheetCell;
  isTotal?: boolean;
  isHeader?: boolean;
  compact?: boolean;
  surface: ScoreSheetSurface;
}) {
  if (cell.kind === 'dash') {
    return (
      <Text
        style={[
          styles.dash,
          compact && styles.dashCompact,
          { color: surface.textMuted },
        ]}
      >
        —
      </Text>
    );
  }
  if (cell.kind === 'empty') {
    return <Text style={styles.dash}> </Text>;
  }
  return (
    <Text
      style={[
        styles.cellValue,
        compact && styles.cellValueCompact,
        { color: surface.text },
        isHeader && styles.headerCellValue,
        isHeader && compact && styles.headerCellValueCompact,
        isHeader && { color: surface.text, fontWeight: '800' },
        isTotal && styles.cellTotal,
        isTotal && compact && styles.cellTotalCompact,
        isTotal && { color: surface.text, fontWeight: '800' },
        cell.emphasize && !isTotal && { fontWeight: '800', color: surface.accent },
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
    >
      {cell.text}
    </Text>
  );
}

function SheetRowView({
  row,
  isHeader,
  compact,
  bodyRowBoost = 0,
  surface,
  rowIndex = 0,
}: {
  row: ScoreSheetRow;
  isHeader?: boolean;
  compact?: boolean;
  bodyRowBoost?: number;
  surface: ScoreSheetSurface;
  rowIndex?: number;
}) {
  const isTotal = row.kind === 'total';
  const isPenalty = row.kind === 'penalty';
  const bodyHeight =
    !isHeader && !isTotal
      ? (compact ? layout.tableRowHeight - 4 : layout.tableRowHeight) +
        bodyRowBoost
      : undefined;

  const rowBg = isHeader
    ? surface.header
    : isTotal
      ? surface.total
      : isPenalty
        ? surface.penalty
        : rowIndex % 2 === 1
          ? surface.rowAlt
          : surface.row;

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        bodyHeight != null && { height: bodyHeight },
        isHeader && styles.headerRow,
        isHeader && compact && styles.headerRowCompact,
        isTotal && styles.totalRow,
        isTotal && compact && styles.totalRowCompact,
        { backgroundColor: rowBg, borderBottomColor: surface.grid },
      ]}
    >
      <View
        style={[
          styles.labelCell,
          compact && styles.labelCellCompact,
          styles.gridBorder,
          { borderRightColor: surface.grid, backgroundColor: rowBg },
        ]}
      >
        <Text
          style={[
            styles.labelText,
            compact && styles.labelTextCompact,
            { color: surface.text },
            isHeader && styles.headerText,
            isTotal && styles.totalLabel,
            isPenalty && { color: surface.accent, fontWeight: '800' },
          ]}
          numberOfLines={1}
        >
          {isTotal ? 'Toplam' : row.label}
        </Text>
        {isPenalty && row.detail ? (
          <Text
            style={[styles.penaltyDetail, { color: surface.textMuted }]}
            numberOfLines={1}
          >
            {row.detail}
          </Text>
        ) : null}
      </View>
      {row.cells.map((cell, index) => (
        <View
          key={`${row.id}-${index}`}
          style={[
            styles.valueCell,
            styles.gridBorder,
            { borderRightColor: surface.grid, backgroundColor: rowBg },
            index === row.cells.length - 1 && styles.gridBorderLast,
          ]}
        >
          <CellText
            cell={cell}
            isTotal={isTotal}
            isHeader={isHeader}
            compact={compact}
            surface={surface}
          />
        </View>
      ))}
    </View>
  );
}

export function ScoreSheetTable({
  model,
  compact = false,
  bodyRowBoost = 0,
  emphasizeHeader = false,
  surface = defaultSurface,
}: ScoreSheetTableProps) {
  const bodyRows = getScoreSheetBodyRows(model);
  const totalRow = getScoreSheetTotalRow(model);
  const scrollRef = useRef<ScrollView>(null);
  const previousCountRef = useRef<number | null>(null);
  const stickToEndRef = useRef(true);
  const animateStickRef = useRef(false);

  const headerRow: ScoreSheetRow = {
    id: 'header',
    label: 'El',
    kind: 'round',
    cells: model.playerNames.map((name) => ({
      kind: 'value',
      text: name,
    })),
  };

  useEffect(() => {
    const previous = previousCountRef.current;
    const next = model.activityRowCount;

    if (previous !== null && didActivityRowCountIncrease(previous, next)) {
      stickToEndRef.current = true;
      animateStickRef.current = true;
    }

    previousCountRef.current = next;
  }, [model.activityRowCount]);

  function handleContentSizeChange() {
    if (!stickToEndRef.current || model.activityRowCount === 0) {
      return;
    }
    scrollRef.current?.scrollToEnd({ animated: animateStickRef.current });
    stickToEndRef.current = false;
  }

  const showTeamTotals =
    model.gameMode === 'paired' &&
    model.teamTotals != null &&
    model.teamNames != null;

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: surface.frame,
          borderColor: surface.grid,
        },
      ]}
    >
      <View
        style={[
          styles.stickyHeader,
          { borderBottomColor: surface.grid },
          emphasizeHeader && {
            borderBottomWidth: 1,
            backgroundColor: surface.header,
          },
        ]}
      >
        <SheetRowView
          row={headerRow}
          isHeader
          compact={compact}
          surface={surface}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={[styles.bodyScroll, { backgroundColor: surface.frame }]}
        contentContainerStyle={[
          styles.bodyContent,
          { backgroundColor: surface.frame },
        ]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={handleContentSizeChange}
      >
        {bodyRows.length === 0 ? (
          <Text style={[styles.empty, { color: surface.textMuted }]}>
            Henüz el yok
          </Text>
        ) : (
          bodyRows.map((row, index) => (
            <SheetRowView
              key={row.id}
              row={row}
              compact={compact}
              bodyRowBoost={bodyRowBoost}
              surface={surface}
              rowIndex={index}
            />
          ))
        )}
      </ScrollView>

      <View
        style={[styles.stickyFooter, { borderTopColor: surface.grid }]}
      >
        {totalRow ? (
          <SheetRowView row={totalRow} compact={compact} surface={surface} />
        ) : null}

        {showTeamTotals ? (
          <View
            style={[
              styles.teamTotals,
              compact && styles.teamTotalsCompact,
              {
                backgroundColor: surface.teamTotals,
                borderTopColor: surface.grid,
              },
            ]}
          >
            <View style={styles.teamTotalBox}>
              <Text
                style={[styles.teamTotalLabel, { color: surface.accent }]}
                numberOfLines={1}
              >
                {model.teamNames![0]}
              </Text>
              <Text
                style={[
                  styles.teamTotalScore,
                  compact && styles.teamTotalScoreCompact,
                  { color: surface.text },
                ]}
              >
                {model.teamTotals![0]}
              </Text>
            </View>
            <View
              style={[styles.teamTotalGold, { backgroundColor: surface.grid }]}
            />
            <View style={styles.teamTotalBox}>
              <Text
                style={[styles.teamTotalLabel, { color: surface.accent }]}
                numberOfLines={1}
              >
                {model.teamNames![1]}
              </Text>
              <Text
                style={[
                  styles.teamTotalScore,
                  compact && styles.teamTotalScoreCompact,
                  { color: surface.text },
                ]}
              >
                {model.teamTotals![1]}
              </Text>
            </View>
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
    borderWidth: 1,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  stickyHeader: {
    borderBottomWidth: 1,
  },
  stickyFooter: {
    borderTopWidth: 1,
  },
  bodyScroll: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: layout.tableRowHeight,
    borderBottomWidth: 1,
  },
  rowCompact: {
    height: layout.tableRowHeight - 4,
  },
  headerRow: {
    height: layout.tableHeaderHeight,
    borderBottomWidth: 0,
  },
  headerRowCompact: {
    height: layout.tableHeaderHeight - 2,
  },
  totalRow: {
    height: layout.tableTotalHeight,
    borderBottomWidth: 0,
  },
  totalRowCompact: {
    height: layout.tableTotalHeight - 4,
  },
  labelCell: {
    width: layout.tableLabelWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  labelCellCompact: {
    width: layout.tableLabelWidth - 4,
  },
  valueCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  gridBorder: {
    borderRightWidth: 1,
  },
  gridBorderLast: {
    borderRightWidth: 0,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelTextCompact: {
    fontSize: 11,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  penaltyDetail: {
    fontSize: 7,
    fontWeight: '600',
    textAlign: 'center',
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  cellValueCompact: {
    fontSize: 12,
  },
  headerCellValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  headerCellValueCompact: {
    fontSize: 11,
  },
  cellTotal: {
    fontSize: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  cellTotalCompact: {
    fontSize: 14,
  },
  dash: {
    fontSize: 13,
  },
  dashCompact: {
    fontSize: 12,
  },
  empty: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 24,
  },
  teamTotals: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 54,
    borderTopWidth: 1,
  },
  teamTotalsCompact: {
    minHeight: 48,
  },
  teamTotalBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 1,
  },
  teamTotalGold: {
    width: 1,
  },
  teamTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  teamTotalScore: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
  teamTotalScoreCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
});
