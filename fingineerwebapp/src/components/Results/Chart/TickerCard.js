import React from "react";
import "./TickerCard.css";

function formatNumber(n, digits = 0) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

function formatCompact(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  // 38_200_000 -> 38,2М
  return new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export default function TickerCard({
  logoUrl,
  symbol = "SBER",
  exchange = "MOEX",
  price = 159.85,
  changePct = 1.26,
  currency = "RUB",
  volume = 38200000,
  onClick,              // пригодится позже (открыть карточку/поиск)
  size = "md",          // md | sm (на будущее)
}) {
  const positive = typeof changePct === "number" ? changePct >= 0 : true;

  return (
    <button
      type="button"
      className={`ticker-card ${size}`}
      onClick={onClick}
      aria-label={`Инструмент ${symbol}, цена ${formatNumber(price, 2)} ${currency}, изменение ${formatNumber(changePct, 2)}%`}
    >
      <div className="tc-row">
        <div className="tc-logo" aria-hidden="true">
          {logoUrl
            ? <img src={logoUrl} alt="" />
            : <div className="tc-logo-fallback">✓</div>}
        </div>
        <div className="tc-head">
          <div className="tc-symbol">{symbol}</div>
          <div className="tc-exchange">{exchange}</div>
        </div>
      </div>

      <div className="tc-price">{formatNumber(price, 2)}</div>

      <div className={`tc-chip ${positive ? "up" : "down"}`}>
        {positive ? "+" : "−"}{formatNumber(Math.abs(changePct), 2)}%
      </div>

      <div className="tc-meta">
        <span className="tc-cur">{currency}</span>
        <span className="tc-dot" />
        <span className="tc-vol">Объём {formatCompact(volume)}</span>
      </div>
    </button>
  );
}
