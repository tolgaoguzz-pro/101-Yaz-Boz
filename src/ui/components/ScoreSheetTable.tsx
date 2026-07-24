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

/** Referans aktif oyun yaz-boz paleti. */
const sheet = {
  cream: '#F7F2E8',
  creamDark: '#EDE6D8',
  creamPenalty: '#E8DFD0',
  gold: '#C8A44D',
  text: '#263238',
  textMuted: '#6B736C',
  line: '#C8C2B4',
  green: '#1F5E3B',
  white: '#FFFFFF',
} as const;

type ScoreSheetTableProps = {
  model: ScoreSheetModel;
};

function CellText({
  cell,
  isTotal,
}: {
  cell: ScoreSheetCell;
  isTotal?: boolean;
}) {
  if (cell.kind === 'dash') {
    return <Text style={styles.dash}>—</Text>;
  }
  if (cell.kind === 'empty') {
    return <Text style={styles.dash}> </Text>;
  }
  return (
    <Text
      style={[
        styles.cellValue,
        isTotal && styles.cellTotal,
        cell.emphasize && styles.cellEmphasize,
      ]}
    >
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
        isHeader && styles.headerRow,
        row.kind === 'penalty' && styles.penaltyRow,
        row.kind === 'total' && styles.totalRow,
      ]}
    >
      <View style={[styles.labelCell, styles.cellBorder]}>
        <Text
          style={[
            styles.labelText,
            isHeader && styles.headerText,
            row.kind === 'total' && styles.totalLabel,
          ]}
          numberOfLines={1}
        >
          {row.kind === 'total' ? 'TOPLAM' : row.label}
        </Text>
      </View>
      {row.cells.map((cell, index) => (
        <View
          key={`${row.id}-${index}`}
          style={[
            styles.valueCell,
            styles.cellBorder,
            index === row.cells.length - 1 && styles.cellBorderLast,
          ]}
        >
          <CellText cell={cell} isTotal={row.kind === 'total'} />
        </View>
      ))}
    </View>
  );
}

export function ScoreSheetTable({ model }: ScoreSheetTableProps) {
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

  return (
    <View style={styles.frame}>
      <View style={styles.stickyHeader}>
        <SheetRowView row={headerRow} isHeader />
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
      </ScrollView>

      <View style={styles.stickyFooter}>
        {totalRow ? <SheetRowView row={totalRow} /> : null}

        {model.gameMode === 'paired' &&
        model.teamTotals &&
        model.teamNames ? (
          <View style={styles.teamTotals}>
            <View style={styles.teamTotalBox}>
              <Text style={styles.teamTotalLabel} numberOfLines={1}>
                {model.teamNames[0]}
              </Text>
              <Text style={styles.teamTotalScore}>{model.teamTotals[0]}</Text>
            </View>
            <View style={styles.teamTotalGold} />
            <View style={styles.teamTotalBox}>
              <Text style={styles.teamTotalLabel} numberOfLines={1}>
                {model.teamNames[1]}
              </Text>
              <Text style={styles.teamTotalScore}>{model.teamTotals[1]}</Text>
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
    backgroundColor: sheet.cream,
    borderWidth: 1,
    borderColor: sheet.gold,
    overflow: 'hidden',
  },
  stickyHeader: {
    borderBottomWidth: 1.5,
    borderBottomColor: sheet.gold,
  },
  stickyFooter: {
    borderTopWidth: 1.5,
    borderTopColor: sheet.gold,
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
    minHeight: 34,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: sheet.line,
  },
  headerRow: {
    minHeight: 38,
    backgroundColor: sheet.creamDark,
    borderBottomWidth: 0,
  },
  penaltyRow: {
    backgroundColor: sheet.creamPenalty,
  },
  totalRow: {
    minHeight: 40,
    backgroundColor: sheet.creamDark,
    borderBottomWidth: 0,
  },
  labelCell: {
    width: 48,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  valueCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: sheet.line,
  },
  cellBorderLast: {
    borderRightWidth: 0,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: sheet.text,
    textAlign: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: sheet.text,
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: sheet.green,
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '600',
    color: sheet.text,
  },
  cellTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: sheet.green,
  },
  cellEmphasize: {
    fontWeight: '800',
    color: sheet.green,
  },
  dash: {
    fontSize: 13,
    color: sheet.textMuted,
  },
  detail: {
    fontSize: 10,
    color: sheet.textMuted,
    paddingLeft: 52,
    paddingBottom: 2,
    backgroundColor: sheet.creamPenalty,
  },
  empty: {
    fontSize: 13,
    fontWeight: '600',
    color: sheet.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  teamTotals: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: sheet.cream,
    minHeight: 64,
  },
  teamTotalBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 2,
  },
  teamTotalGold: {
    width: 1.5,
    backgroundColor: sheet.gold,
  },
  teamTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: sheet.textMuted,
    textAlign: 'center',
  },
  teamTotalScore: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    color: sheet.green,
  },
});
