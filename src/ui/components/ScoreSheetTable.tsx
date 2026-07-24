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

/** Yaz-boz kağıdı paleti. */
const sheet = {
  cream: '#F7F2E8',
  creamHeader: '#EFE8DB',
  creamTotal: '#E8DFD0',
  penalty: '#F7EFC0',
  gold: '#C8A44D',
  goldSoft: 'rgba(200, 164, 77, 0.55)',
  text: '#263238',
  textMuted: '#6B736C',
  line: '#D4CBB8',
  green: '#1F5E3B',
  white: '#FFFFFF',
} as const;

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 40;
const TOTAL_HEIGHT = 42;
const LABEL_WIDTH = 46;

type ScoreSheetTableProps = {
  model: ScoreSheetModel;
};

function CellText({
  cell,
  isTotal,
  isHeader,
}: {
  cell: ScoreSheetCell;
  isTotal?: boolean;
  isHeader?: boolean;
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
        isHeader && styles.headerCellValue,
        isTotal && styles.cellTotal,
        cell.emphasize && !isTotal && styles.cellEmphasize,
      ]}
      numberOfLines={1}
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
  const isTotal = row.kind === 'total';
  const isPenalty = row.kind === 'penalty';

  return (
    <View
      style={[
        styles.row,
        isHeader && styles.headerRow,
        isPenalty && styles.penaltyRow,
        isTotal && styles.totalRow,
      ]}
    >
      <View style={[styles.labelCell, styles.gridBorder]}>
        <Text
          style={[
            styles.labelText,
            isHeader && styles.headerText,
            isTotal && styles.totalLabel,
          ]}
          numberOfLines={1}
        >
          {isTotal ? 'TOPLAM' : row.label}
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
          <CellText cell={cell} isTotal={isTotal} isHeader={isHeader} />
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
          bodyRows.map((row) => <SheetRowView key={row.id} row={row} />)
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
    borderWidth: 1.5,
    borderColor: sheet.gold,
    borderRadius: 4,
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
    height: ROW_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: sheet.line,
  },
  headerRow: {
    height: HEADER_HEIGHT,
    backgroundColor: sheet.creamHeader,
    borderBottomWidth: 0,
  },
  penaltyRow: {
    backgroundColor: sheet.penalty,
  },
  totalRow: {
    height: TOTAL_HEIGHT,
    backgroundColor: sheet.creamTotal,
    borderBottomWidth: 0,
  },
  labelCell: {
    width: LABEL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  valueCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  gridBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: sheet.goldSoft,
  },
  gridBorderLast: {
    borderRightWidth: 0,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    color: sheet.text,
    textAlign: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '800',
    color: sheet.green,
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: sheet.green,
  },
  penaltyDetail: {
    fontSize: 8,
    fontWeight: '600',
    color: sheet.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '600',
    color: sheet.text,
    textAlign: 'center',
  },
  headerCellValue: {
    fontSize: 11,
    fontWeight: '800',
    color: sheet.green,
  },
  cellTotal: {
    fontSize: 15,
    fontWeight: '900',
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
  empty: {
    fontSize: 13,
    fontWeight: '600',
    color: sheet.textMuted,
    textAlign: 'center',
    paddingVertical: 28,
  },
  teamTotals: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: sheet.white,
    minHeight: 58,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: sheet.goldSoft,
  },
  teamTotalBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },
  teamTotalGold: {
    width: 1.5,
    backgroundColor: sheet.gold,
  },
  teamTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: sheet.textMuted,
    textAlign: 'center',
  },
  teamTotalScore: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
    color: sheet.green,
  },
});
