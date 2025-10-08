import React, { useEffect, useRef } from "react";

export default function WorkerProbe() {
  const wref = useRef(null);

  useEffect(() => {
    const src = `
      /* eslint-disable no-restricted-globals */
      self.onmessage = (e) => {
        const d = e.data || {};
        if (d.type === 'PING') {
          self.postMessage({ ok:true, reply:'PONG', echo:d.payload });
          return;
        }
        // fallback: просто эхо
        self.postMessage({ ok:true, echoOnly:true, got:d });
      };
    `;
    const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
    const w = new Worker(url);
    wref.current = w;

    w.onmessage = (e) => console.log("[WorkerProbe message]", e.data);
    w.onerror   = (e) => console.error("[WorkerProbe error]", e);

    // авто-PING при монтировании
    w.postMessage({ type: "PING", payload: { when: Date.now() } });

    return () => {
      try { w.terminate(); } catch {}
      wref.current = null;
      URL.revokeObjectURL(url);
    };
  }, []);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        onClick={() => {
          const w = wref.current;
          if (!w) return alert("worker not ready");
          const onOnce = (e) => {
            w.removeEventListener("message", onOnce);
            console.log("[WorkerProbe click reply]", e.data);
            alert("Worker replied: " + JSON.stringify(e.data));
          };
          w.addEventListener("message", onOnce);
          w.postMessage({ type: "PING", payload: { click: Date.now() } });
        }}
        style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#fff", cursor: "pointer" }}
      >
        PING WORKER
      </button>
      <span style={{ color: "#9CA3AF", fontSize: 12 }}>Логи ищи в консоли: “WorkerProbe …”</span>
    </div>
  );
}
