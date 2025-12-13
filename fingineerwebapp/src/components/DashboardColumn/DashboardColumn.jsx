import React from "react";
import styles from "./DashboardColumn.module.css";
import WidgetCard from "./WidgetCard";
import TrendMomentumWidget from "./widgets/TrendMomentumWidget";
import VolatilityRiskWidget from "./widgets/VolatilityRiskWidget";
import CatalystsWidget from "./widgets/CatalystsWidget";
import LiquidityWidget from "./widgets/LiquidityWidget";

// Пока моки; позже возьмём из ChartContext или пропсов родителя
const mock = {
  ticker: "SBER",
  price: 275.5,
  prevClose: 270.0,
  dayHigh: 278.0,
  dayLow: 269.2,
  ema20D: 260.0,
  ema50D: 250.0,
  rsi14D: 62,
  atr14Abs: 5.2,
  atr14Pct: 1.9,
  todayRangePct: 1.1,
  nextDividend: { amount: 5.0, exDate: "2025-12-01", yieldPct: 1.8 },
  news: { count72h: 2, items: [{ title: "Совдир одобрил дивиденды", ts: Date.now() - 3600e3 }] },
  avgVol20d: 1_300_000,
  avgTurnover20dRub: 260_000_000,
  todayVol: 700_000,
  todayTurnoverRub: 140_000_000,
};

export default function DashboardColumn({ activeTicker, instrumentMeta, lastCandleData }) {
  // Лёгкая подстановка данных контекста (остальное пока остаётся на моках)
  const merged = {
    ...mock,
    ticker: instrumentMeta?.symbol || activeTicker || mock.ticker,
    price: lastCandleData?.c ?? lastCandleData?.close ?? mock.price,
    prevClose: lastCandleData?.pc ?? lastCandleData?.prevClose ?? mock.prevClose,
  };

  return (
    <aside className={`${styles["dashboard-column"]} dc-root`}>
      <WidgetCard title="Тренд и моментум">
        <TrendMomentumWidget {...merged} />
      </WidgetCard>
      <WidgetCard title="Волатильность и риск">
        <VolatilityRiskWidget {...merged} />
      </WidgetCard>
      <WidgetCard title="Катализаторы">
        <CatalystsWidget {...merged} />
      </WidgetCard>
      <WidgetCard title="Ликвидность и объём">
        <LiquidityWidget {...merged} />
      </WidgetCard>
    </aside>
  );
}
