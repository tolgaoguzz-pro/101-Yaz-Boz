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

type ScoreSheetTableProps = {
  model: ScoreSheetModel;
  compact?: boolean;
  /** Aktif oyun mikro rötuş: gövde satır yüksekliği (+px). */
  bodyRowBoost?: number;
  /** Başlık ile ilk satır ayrımını güçlendir. */
  emphasizeHeader?: boolean;
};

function CellText({
  cell,
  isTotal,
  isHeader,
  compact,
}: {
  cell: ScoreSheetCell;
  isTotal?: boolean;
  isHeader?: boolean;
  compact?: boolean;
}) {
  if (cell.kind === 'dash') {
    return <Text style={[styles.dash, compact && styles.dashCompact]}>—</Text>;
  }
  if (cell.kind === 'empty') {
    return <Text style={styles.dash}> </Text>;
  }
  return (
    <Text
      style={[
        styles.cellValue,
        compact && styles.cellValueCompact,
        isHeader && styles.headerCellValue,
        isHeader && compact && styles.headerCellValueCompact,
        isTotal && styles.cellTotal,
        isTotal && compact && styles.cellTotalCompact,
        cell.emphasize && !isTotal && styles.cellEmphasize,
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
}: {
  row: ScoreSheetRow;
  isHeader?: boolean;
  compact?: boolean;
  bodyRowBoost?: number;
}) {
  const isTotal = row.kind === 'total';
  const isPenalty = row.kind === 'penalty';
  const bodyHeight =
    !isHeader && !isTotal
      ? (compact ? layout.tableRowHeight - 4 : layout.tableRowHeight) +
        bodyRowBoost
      : undefined;

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        bodyHeight != null && { height: bodyHeight },
        isHeader && styles.headerRow,
        isHeader && compact && styles.headerRowCompact,
        isPenalty && styles.penaltyRow,
        isTotal && styles.totalRow,
        isTotal && compact && styles.totalRowCompact,
      ]}
    >
      <View
        style={[
          styles.labelCell,
          compact && styles.labelCellCompact,
          styles.gridBorder,
        ]}
      >
        <Text
          style={[
            styles.labelText,
            compact && styles.labelTextCompact,
            isHeader && styles.headerText,
            isTotal && styles.totalLabel,
            isPenalty && styles.penaltyLabel,
          ]}
          numberOfLines={1}
        >
          {isTotal ? 'Toplam' : row.label}
        </Text>
        {isPenalty && row.detail ? (
          <Text style={styles.penaltyDetail} numberOfLines={1}>
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
            index === row.cells.length - 1 && styles.gridBorderLast,
          ]}
        >
          <CellText
            cell={cell}
            isTotal={isTotal}
            isHeader={isHeader}
            compact={compact}
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
    <View style={styles.frame}>
      <View
        style={[
          styles.stickyHeader,
          emphasizeHeader && styles.stickyHeaderEmphasized,
        ]}
      >
        <SheetRowView row={headerRow} isHeader compact={compact} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={handleContentSizeChange}
      >
        {bodyRows.length === 0 ? (
          <Text style={styles.empty}>Henüz el yok</Text>
        ) : (
          bodyRows.map((row) => (
            <SheetRowView
              key={row.id}
              row={row}
              compact={compact}
              bodyRowBoost={bodyRowBoost}
            />
          ))
        )}
      </ScrollView>

      <View style={styles.stickyFooter}>
        {totalRow ? <SheetRowView row={totalRow} compact={compact} /> : null}

        {showTeamTotals ? (
          <View style={[styles.teamTotals, compact && styles.teamTotalsCompact]}>
            <View style={styles.teamTotalBox}>
              <Text style={styles.teamTotalLabel} numberOfLines={1}>
                {model.teamNames![0]}
              </Text>
              <Text
                style={[
                  styles.teamTotalScore,
                  compact && styles.teamTotalScoreCompact,
                ]}
              >
                {model.teamTotals![0]}
              </Text>
            </View>
            <View style={styles.teamTotalGold} />
            <View style={styles.teamTotalBox}>
              <Text style={styles.teamTotalLabel} numberOfLines={1}>
                {model.teamNames![1]}
              </Text>
              <Text
                style={[
                  styles.teamTotalScore,
                  compact && styles.teamTotalScoreCompact,
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
    backgroundColor: colors.cream,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldSoft,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  stickyHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  stickyHeaderEmphasized: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.goldSoft,
    backgroundColor: colors.creamHeader,
  },
  stickyFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowCompact: {
    height: layout.tableRowHeight - 4,
  },
  headerRow: {
    height: layout.tableHeaderHeight,
    backgroundColor: colors.cream,
    borderBottomWidth: 0,
  },
  headerRowCompact: {
    height: layout.tableHeaderHeight - 2,
  },
  penaltyRow: {
    backgroundColor: colors.penalty,
  },
  totalRow: {
    height: layout.tableTotalHeight,
    backgroundColor: colors.cream,
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
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.line,
  },
  gridBorderLast: {
    borderRightWidth: 0,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  labelTextCompact: {
    fontSize: 11,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  penaltyLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.green,
  },
  penaltyDetail: {
    fontSize: 7,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  cellValueCompact: {
    fontSize: 12,
  },
  headerCellValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  headerCellValueCompact: {
    fontSize: 11,
  },
  cellTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
  },
  cellTotalCompact: {
    fontSize: 14,
  },
  cellEmphasize: {
    fontWeight: '800',
    color: colors.green,
  },
  dash: {
    fontSize: 13,
    color: colors.textMuted,
  },
  dashCompact: {
    fontSize: 12,
  },
  empty: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  teamTotals: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.cream,
    minHeight: 54,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
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
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
  teamTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.green,
    textAlign: 'center',
  },
  teamTotalScore: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
    color: colors.text,
  },
  teamTotalScoreCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
});
