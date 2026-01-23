import React, { useCallback, useEffect, useMemo, useState } from "react";
import formatInstrumentMeta from "../../../utils/formatInstrumentMeta";
import "./TickerCard.css";
import { InstrumentPassport } from "../../InstrumentPassport/InstrumentPassport";
import { useSparklineData } from "../../../hooks/useSparklineData";

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatNumber = (value, digits = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

const formatCompact = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const EPSILON_PERCENT = 0.01; // ~0.01%
const EPSILON_RATIO = EPSILON_PERCENT / 100; // 0.0001

const getSymbolInitial = (symbol) => {
  if (!symbol) return "?";
  return String(symbol).trim().charAt(0).toUpperCase();
};

const buildActionHandler = (cb) => (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (typeof cb === "function") cb();
};

const normalizeSectorLabel = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  return trimmed.replace(/^Сектор\s+/iu, "").trim();
};

export default function TickerCard({
  instrumentMeta = {},
  hover,
  showPrice = false,
  size = "md",
  onOpenSearch,
  onActionCompare,
  onActionNews,
}) {
  const formattedMeta = useMemo(
    () => formatInstrumentMeta(instrumentMeta, { now: Date.now() }),
    [instrumentMeta]
  );

  const {
    identity,
    session,
    currencySymbol,
    raw,
  } = formattedMeta;

  const activeTicker = identity?.symbol || instrumentMeta?.symbol || "DSKY";
  const { pulseData } = useSparklineData(activeTicker);

  const symbolId = instrumentMeta?.symbolId ? String(instrumentMeta.symbolId).toUpperCase() : null;
  const hoverSymbolId = hover?.symbolId ? String(hover.symbolId).toUpperCase() : null;
  const sameInstrument = Boolean(
    hover && symbolId && hoverSymbolId && hoverSymbolId === symbolId
  );

  const priceView = useMemo(() => {
    const dayPrice = toNumber(instrumentMeta?.lastPrice);
    const dayChange = toNumber(instrumentMeta?.dayChangePct);
    const dayVolume = toNumber(instrumentMeta?.dayVolume);
    const prevClose = toNumber(instrumentMeta?.prevClose);

    const fallbackPrice = dayPrice ?? prevClose ?? null;

    const dayPercent = (() => {
      if (dayChange !== null && Number.isFinite(dayChange)) {
        return dayChange;
      }
      if (prevClose !== null && prevClose !== 0 && dayPrice !== null) {
        return ((dayPrice - prevClose) / prevClose) * 100;
      }
      return 0;
    })();

    const dayTrend = dayPercent > 0 ? "up" : dayPercent < 0 ? "down" : "flat";

    const hoverPrice = sameInstrument ? toNumber(hover?.price ?? hover?.close) : null;
    const hoverVolume = sameInstrument ? toNumber(hover?.volume) : null;

    const resolvedHover = (() => {
      if (!sameInstrument || hoverPrice === null) {
        return null;
      }

      const reference =
        hover?.kind === "candles"
          ? toNumber(hover?.prevClose ?? prevClose)
          : toNumber(hover?.baseline ?? prevClose);

      const volumeValue = hoverVolume !== null ? hoverVolume : dayVolume ?? null;

      if (reference !== null && reference !== 0) {
        const ratio = (hoverPrice - reference) / reference;
        const pct = Math.abs(ratio) <= EPSILON_RATIO ? 0 : ratio * 100;
        const trend = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
        return {
          price: hoverPrice,
          pct,
          trend,
          volume: volumeValue,
          deltaAbs: Math.abs(pct),
        };
      }

      return {
        price: hoverPrice,
        pct: 0,
        trend: "flat",
        volume: volumeValue,
        deltaAbs: 0,
      };
    })();

    const displayPrice = resolvedHover ? resolvedHover.price : fallbackPrice;
    const displayPct = resolvedHover ? resolvedHover.pct : dayPercent;
    const displayVolume = resolvedHover ? resolvedHover.volume : dayVolume ?? null;
    const trend = resolvedHover ? resolvedHover.trend : dayTrend;
    const pctValue = Number.isFinite(displayPct) ? displayPct : 0;

    return {
      priceLabel: formatNumber(displayPrice, 2),
      percentLabel: `${pctValue >= 0 ? "+" : "−"}${formatNumber(Math.abs(pctValue), 2)}%`,
      volumeLabel:
        displayVolume !== null && displayVolume !== undefined
          ? formatCompact(displayVolume)
          : "—",
      isLive: Boolean(resolvedHover && displayPrice !== null),
      trend,
      hoverDeltaAbs: resolvedHover?.deltaAbs ?? null,
    };
  }, [hover, instrumentMeta, sameInstrument]);

  const infoRows = useMemo(() => {
    const rows = [];
    const sectorSource =
      raw?.sectorName ||
      raw?.industry ||
      raw?.sector ||
      "";
    const sectorValue = normalizeSectorLabel(sectorSource);
    if (sectorValue) {
      const sectorOriginal = raw?.sectorOriginal ? String(raw.sectorOriginal).trim() : "";
      const sectorTooltip =
        sectorOriginal && sectorOriginal.toLowerCase() !== sectorValue.toLowerCase()
          ? `Отрасль эмитента. Биржевой классификатор: ${sectorOriginal}.`
          : "Отрасль эмитента на Московской бирже.";
      rows.push({
        key: "sector",
        label: "Сектор",
        value: sectorValue,
        tooltip: sectorTooltip,
      });
    }

    const sessionValue = session?.labelFull || session?.labelShort || "—";
    let sessionTooltip = "Текущая торговая сессия.";
    if (session?.labelFull) {
      sessionTooltip = `Текущая торговая сессия: ${session.labelFull}.`;
    }
    if (session?.hasAuction) {
      sessionTooltip += " Сейчас идёт аукцион.";
    }
    if (session?.halted) {
      sessionTooltip += " Торги приостановлены.";
    }

    rows.push({
      key: "session",
      label: "Сессия",
      value: sessionValue,
      tooltip: sessionTooltip,
      tone: session?.tone || "default",
    });

    return rows;
  }, [raw?.sector, raw?.sectorName, raw?.industry, raw?.sectorOriginal, session]);

  // --- Derived labels for InstrumentPassport ---
  const exchangeLabel = identity?.exchange || "MOEX";
  const instrumentTypeLabel = identity?.instrumentLabel || "АКЦИЯ";
  const sectorRow = infoRows.find((row) => row.key === "sector");
  const sectorLabel = sectorRow ? sectorRow.value : "Мосбиржи";
  const sessionLabel = session?.name || session?.code || "Основная";
  // --- end derived labels ---

  const [activeHint, setActiveHint] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const handleHintEnter = useCallback((key) => {
    setActiveHint(key);
  }, []);

  // eslint-disable-next-line no-unused-vars
  const handleHintLeave = useCallback((key) => {
    setActiveHint((prev) => (prev === key ? null : prev));
  }, []);

  // eslint-disable-next-line no-unused-vars
  const handleHintToggle = useCallback((event, key) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveHint((prev) => (prev === key ? null : key));
  }, []);

  useEffect(() => {
    if (!activeHint) return;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setActiveHint(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [activeHint]);

  // eslint-disable-next-line no-unused-vars
  const tooltipId = useCallback((key) => `tc-hint-${key}`, []);

  if (showPrice) {
    const { trend, priceLabel, percentLabel, volumeLabel, isLive, hoverDeltaAbs } = priceView;
    const hoverIsLine = Boolean(hover?.kind === "line");

    return (
      <button
        type="button"
        className={`ticker-card ticker-card--price has-tooltip ${size}`}
        data-trend={trend}
        data-live={isLive ? "1" : "0"}
        onClick={buildActionHandler(onOpenSearch)}
        aria-label={`Инструмент ${identity.symbol}, цена ${priceLabel} ${currencySymbol || ""}, изменение ${percentLabel}`}
        aria-describedby="tc-tip"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="tc-row">
          <div className="tc-logo" aria-hidden="true">
            {identity.logoUrl ? (
              <img src={identity.logoUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            ) : (
              <div className="tc-logo-fallback">{getSymbolInitial(identity.symbol)}</div>
            )}
          </div>
          <div className="tc-head">
            <div className="tc-symbol">{identity.symbol}</div>
            <div className="tc-exchange">{identity.exchange}</div>
          </div>
        </div>

        <div className="tc-price" data-trend={trend}>
          {priceLabel}
          {isLive && <span className="tc-live-dot" aria-hidden="true" />}
        </div>

        <div className="tc-chip" data-trend={trend}>
          {percentLabel}
        </div>

        <div className="tc-meta">
          <span className="tc-cur">{currencySymbol || ""}</span>
          <span className="tc-dot" />
          <span className="tc-vol">
            {hoverDeltaAbs !== null && hoverIsLine
              ? `Δ ${formatNumber(hoverDeltaAbs, 2)}%`
              : `Объём ${volumeLabel}`}
          </span>
        </div>

        <span id="tc-tip" className="tc-tooltip tc-tooltip--east" role="tooltip">
          Сменить тикер
        </span>
      </button>
    );
  }

    return (
      <>
        <div
          style={{
            marginLeft: '-8px',
            marginRight: '8px',
          }}
        >
          <InstrumentPassport
            ticker={activeTicker}
            exchange={exchangeLabel}
            instrumentType={instrumentTypeLabel}
            sector={sectorLabel}
            sessionName={sessionLabel}
            pulseData={pulseData}
            size="compact"
          />
        </div>
        {/* Legacy layout preserved for rollback:
        <article className={`ticker-card ticker-card--passport ${size}`} data-session={session.code}>
          <div className="tc-passport-identity">
            <div className="tc-logo" aria-hidden="true">
              {identity.logoUrl ? (
                <img src={identity.logoUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
              ) : (
                <div className="tc-logo-fallback">{getSymbolInitial(identity.symbol)}</div>
              )}
            </div>
            <div className="tc-id">
              <div className="tc-symbol-row">
                <span className="tc-symbol">{identity.symbol}</span>
                {identity.exchange && <span className="tc-exchange">{identity.exchange}</span>}
              </div>
              {identity.name && (
                <div className="tc-name" title={instrumentMeta?.instrumentName || identity.name}>
                  {identity.name}
                </div>
              )}
              <div className="tc-type">{identity.instrumentLabel}</div>
            </div>
          </div>

          <div className="tc-divider" aria-hidden="true" />

          {infoRows.length > 0 && (
            <div className="tc-info-grid">
              {infoRows.map((row) => {
                const isHintVisible = activeHint === row.key;
                const id = tooltipId(row.key);
                return (
                  <div key={row.key} className="tc-info-row">
                    <span className="tc-info-label">
                      <span className="tc-info-label-text">{row.label}</span>
                      {row.tooltip && (
                        <button
                          type="button"
                          className="tc-info-hint"
                          aria-label={`Подсказка: ${row.label}`}
                          aria-describedby={id}
                          aria-expanded={isHintVisible ? "true" : "false"}
                          aria-haspopup="true"
                          onClick={(event) => handleHintToggle(event, row.key)}
                          onMouseEnter={() => handleHintEnter(row.key)}
                          onMouseLeave={() => handleHintLeave(row.key)}
                          onFocus={() => handleHintEnter(row.key)}
                          onBlur={() => handleHintLeave(row.key)}
                          data-active={isHintVisible ? "1" : undefined}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path
                              d="M12 16V12M12 8H12.01"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                      {row.tooltip && (
                        <span
                          id={id}
                          role="tooltip"
                          className="tc-tooltip tc-tooltip--sup"
                          data-visible={isHintVisible ? "1" : "0"}
                          aria-hidden={isHintVisible ? "false" : "true"}
                        >
                          {row.tooltip}
                        </span>
                      )}
                    </span>
                    <span className="tc-info-value" data-tone={row.tone || "default"}>
                      {row.value}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {divInfo && (
            <div className="tc-highlight" aria-label="Ближайший дивиденд">
              <span className="tc-highlight__label">Див:</span>
              <span className="tc-highlight__value">
                {divInfo.amountFormatted ?? "—"}
                {divInfo.currencySymbol ? ` ${divInfo.currencySymbol}` : ""}
              </span>
              <span className="tc-highlight__dot" aria-hidden="true">•</span>
              <span className="tc-highlight__date">{divInfo.dateShort}</span>
            </div>
          )}

          <div className="tc-actions">
            <button
              type="button"
              className="tc-action"
              onClick={onActionCompare ? buildActionHandler(onActionCompare) : undefined}
            >
              Сравнить
            </button>
            <button
              type="button"
              className="tc-action"
              onClick={
                (onActionNews || onOpenSearch)
                  ? buildActionHandler(onActionNews || onOpenSearch)
                  : undefined
              }
              data-action="news"
            >
              Новости
            </button>
          </div>
        </article>
        */}
      </>
    );
}
