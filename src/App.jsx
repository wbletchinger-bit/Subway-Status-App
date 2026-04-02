import { useState, useEffect } from 'react';

const LINE_META = {
  1: { bg: '#EE352E', fg: '#fff' },
  2: { bg: '#EE352E', fg: '#fff' },
  3: { bg: '#EE352E', fg: '#fff' },
  4: { bg: '#00933C', fg: '#fff' },
  5: { bg: '#00933C', fg: '#fff' },
  6: { bg: '#00933C', fg: '#fff' },
  7: { bg: '#B933AD', fg: '#fff' },
  A: { bg: '#0039A6', fg: '#fff' },
  C: { bg: '#0039A6', fg: '#fff' },
  E: { bg: '#0039A6', fg: '#fff' },
  B: { bg: '#FF6319', fg: '#fff' },
  D: { bg: '#FF6319', fg: '#fff' },
  F: { bg: '#FF6319', fg: '#fff' },
  M: { bg: '#FF6319', fg: '#fff' },
  G: { bg: '#6CBE45', fg: '#fff' },
  J: { bg: '#996633', fg: '#fff' },
  Z: { bg: '#996633', fg: '#fff' },
  L: { bg: '#A7A9AC', fg: '#fff' },
  N: { bg: '#FCCC0A', fg: '#000' },
  Q: { bg: '#FCCC0A', fg: '#000' },
  R: { bg: '#FCCC0A', fg: '#000' },
  W: { bg: '#FCCC0A', fg: '#000' },
  S: { bg: '#808183', fg: '#fff' },
};

const LINE_GROUPS = [
  { lines: ['1', '2', '3'] },
  { lines: ['4', '5', '6'] },
  { lines: ['7'] },
  { lines: ['A', 'C', 'E'] },
  { lines: ['B', 'D', 'F', 'M'] },
  { lines: ['G'] },
  { lines: ['J', 'Z'] },
  { lines: ['L'] },
  { lines: ['N', 'Q', 'R', 'W'] },
  { lines: ['S'] },
];

const STATUS_CFG = {
  good: {
    label: 'Good service',
    bg: '#e6f9ee',
    text: '#1a7a3f',
    dot: '#00933C',
  },
  delay: { label: 'Delays', bg: '#fff4e0', text: '#a05c00', dot: '#FF6319' },
  change: {
    label: 'Service change',
    bg: '#e8f0fb',
    text: '#1a3a7a',
    dot: '#0039A6',
  },
  suspended: {
    label: 'Suspended',
    bg: '#fdeaea',
    text: '#a01a1a',
    dot: '#EE352E',
  },
  planned: {
    label: 'Planned work',
    bg: '#f2f2f2',
    text: '#555',
    dot: '#808183',
  },
};

const SAVED_ROUTES = [
  {
    id: 1,
    name: 'Home → Work',
    from: '86 St (Q/R)',
    to: '14 St–Union Sq',
    lines: ['Q', '4', '5', '6'],
    note: 'Take Q to Union Sq, or 4/5/6 express',
  },
  {
    id: 2,
    name: 'Work → Gym',
    from: '14 St–Union Sq',
    to: 'Jay St–MetroTech',
    lines: ['F'],
    note: 'F train direct, 8 stops',
  },
  {
    id: 3,
    name: "Home → Friend's",
    from: '86 St',
    to: 'Smith–9 Sts',
    lines: ['F'],
    note: 'F to Smith-9 Sts, 12 stops',
  },
];

function groupStatus(lines, lineStatus) {
  const order = ['suspended', 'delay', 'change', 'planned', 'good'];
  for (const s of order) if (lines.some((l) => lineStatus[l] === s)) return s;
  return 'good';
}

function LineBadge({ line, size = 26, onClick }) {
  const m = LINE_META[line] || { bg: '#ccc', fg: '#fff' };
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: m.bg,
        color: m.fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.44),
        fontWeight: 500,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {line}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.good;
  return (
    <span
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 6,
        background: s.bg,
        color: s.text,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function StatusDot({ status, size = 8 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: (STATUS_CFG[status] || STATUS_CFG.good).dot,
        flexShrink: 0,
      }}
    />
  );
}

export default function App() {
  const [tab, setTab] = useState('overview');
  const [selectedLine, setSelectedLine] = useState(null);
  const [lineStatus, setLineStatus] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setLineStatus(data.lineStatus || {});
        setAlerts(data.alerts || []);
        setUpdatedAt(data.updatedAt);
        setError(null);
      } catch (e) {
        setError('Could not load MTA data. Retrying...');
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 1200);
    return () => clearInterval(t);
  }, []);

  const card = {
    background: '#fff',
    border: '0.5px solid #e0e0e0',
    borderRadius: 12,
    padding: '10px 12px',
    marginBottom: 6,
  };

  const sectionLabel = (text) => (
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.06em',
        color: '#888',
        marginBottom: 10,
      }}
    >
      {text}
    </div>
  );

  const alertsForLine = (line) => alerts.filter((a) => a.lines?.includes(line));

  if (loading)
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#888',
          fontFamily: 'system-ui',
        }}
      >
        Loading MTA data...
      </div>
    );

  return (
    <div
      style={{
        padding: '0 16px 2rem',
        maxWidth: 580,
        margin: '0 auto',
        fontFamily: 'system-ui',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 0 10px',
          borderBottom: '0.5px solid #e0e0e0',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 500 }}>TrainCheck NYC</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#00933C',
                opacity: blink ? 1 : 0.3,
                transition: 'opacity 0.4s',
              }}
            />
            <span style={{ fontSize: 12, color: '#888' }}>
              {updatedAt
                ? 'Updated ' +
                  new Date(updatedAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Loading...'}
            </span>
          </div>
        </div>
        {error && (
          <div
            style={{
              fontSize: 12,
              color: '#a05c00',
              background: '#fff4e0',
              padding: '6px 10px',
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            ['overview', 'Overview'],
            ['my commute', 'My Commute'],
            ['alerts', 'All Alerts'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setSelectedLine(null);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border:
                  tab === key && !selectedLine
                    ? '0.5px solid #999'
                    : '0.5px solid #e0e0e0',
                background:
                  tab === key && !selectedLine ? '#f2f2f2' : 'transparent',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'system-ui',
                color: tab === key && !selectedLine ? '#111' : '#888',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Line detail view */}
      {selectedLine && (
        <div>
          <button
            onClick={() => setSelectedLine(null)}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              border: '0.5px solid #e0e0e0',
              background: 'transparent',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'system-ui',
              color: '#888',
              marginBottom: 12,
            }}
          >
            ← Back
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <LineBadge line={selectedLine} size={36} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>
                {selectedLine} Train
              </div>
              <StatusBadge status={lineStatus[selectedLine] || 'good'} />
            </div>
          </div>
          {alertsForLine(selectedLine).length === 0 ? (
            <div style={{ ...card, color: '#1a7a3f', fontSize: 14 }}>
              No active alerts — trains running on or close to schedule.
            </div>
          ) : (
            alertsForLine(selectedLine).map((a) => (
              <div key={a.id} style={card}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 5,
                    flexWrap: 'wrap',
                  }}
                >
                  {(a.lines || []).map((l) => (
                    <LineBadge key={l} line={l} size={20} />
                  ))}
                  <StatusBadge status={a.status} />
                  <span
                    style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}
                  >
                    {a.time}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                  {a.detail}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Overview tab */}
      {!selectedLine && tab === 'overview' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {[
              {
                label: 'Lines good',
                val: Object.values(lineStatus).filter((s) => s === 'good')
                  .length,
                color: '#1a7a3f',
              },
              {
                label: 'Delays',
                val: Object.values(lineStatus).filter((s) => s === 'delay')
                  .length,
                color: '#a05c00',
              },
              {
                label: 'Issues',
                val: Object.values(lineStatus).filter((s) =>
                  ['suspended', 'change'].includes(s)
                ).length,
                color: '#a01a1a',
              },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  background: '#f7f7f7',
                  borderRadius: 8,
                  padding: 10,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 500, color: m.color }}>
                  {m.val}
                </div>
              </div>
            ))}
          </div>

          {sectionLabel('ALL LINES')}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              marginBottom: 20,
            }}
          >
            {LINE_GROUPS.map((g, i) => {
              const gs = groupStatus(g.lines, lineStatus);
              return (
                <div
                  key={i}
                  style={{
                    ...card,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    marginBottom: 0,
                  }}
                  onClick={() => {
                    setSelectedLine(g.lines[0]);
                  }}
                >
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {g.lines.map((l) => (
                      <LineBadge
                        key={l}
                        line={l}
                        size={24}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLine(l);
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ flex: 1 }} />
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <StatusDot status={gs} />
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {STATUS_CFG[gs]?.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {sectionLabel('RECENT ALERTS')}
          {alerts.length === 0 ? (
            <div style={{ ...card, color: '#1a7a3f', fontSize: 13 }}>
              No active alerts right now.
            </div>
          ) : (
            alerts.slice(0, 4).map((a) => (
              <div key={a.id} style={card}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 5,
                    flexWrap: 'wrap',
                  }}
                >
                  {(a.lines || []).slice(0, 4).map((l) => (
                    <LineBadge key={l} line={l} size={20} />
                  ))}
                  <StatusBadge status={a.status} />
                  <span
                    style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}
                  >
                    {a.time}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                  {a.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#666',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {a.detail}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Commute tab */}
      {!selectedLine && tab === 'my commute' && (
        <div>
          {sectionLabel('SAVED ROUTES')}
          {SAVED_ROUTES.map((r) => {
            const routeStatus = groupStatus(r.lines, lineStatus);
            const routeAlerts = alerts.filter((a) =>
              r.lines.some((l) => a.lines?.includes(l))
            );
            return (
              <div key={r.id} style={card}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {r.name}
                  </span>
                  <StatusBadge status={routeStatus} />
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                  {r.from} → {r.to}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: routeAlerts.length ? 8 : 0,
                  }}
                >
                  {r.lines.map((l) => (
                    <LineBadge key={l} line={l} size={22} />
                  ))}
                  <span style={{ fontSize: 12, color: '#888' }}>{r.note}</span>
                </div>
                {routeAlerts.slice(0, 1).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      fontSize: 12,
                      color: '#a05c00',
                      background: '#fff4e0',
                      padding: '6px 8px',
                      borderRadius: 8,
                      marginTop: 4,
                    }}
                  >
                    {a.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* All Alerts tab */}
      {!selectedLine && tab === 'alerts' && (
        <div>
          {sectionLabel(`${alerts.length} ACTIVE ALERTS`)}
          {alerts.length === 0 ? (
            <div style={{ ...card, color: '#1a7a3f', fontSize: 13 }}>
              No active alerts right now — good news!
            </div>
          ) : (
            alerts.map((a) => (
              <div key={a.id} style={card}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 5,
                    flexWrap: 'wrap',
                  }}
                >
                  {(a.lines || []).slice(0, 4).map((l) => (
                    <LineBadge key={l} line={l} size={22} />
                  ))}
                  <StatusBadge status={a.status} />
                  <span
                    style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}
                  >
                    {a.time}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                  {a.detail}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
