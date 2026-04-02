import https from "https";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const ALERTS_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys/subway-alerts";

const ALL_LINES = [
  "1","2","3","4","5","6","7",
  "A","C","E","B","D","F","M",
  "G","J","Z","L","N","Q","R","W","S"
];

const EFFECT_MAP = {
  1:"suspended", 2:"delay", 3:"delay",
  4:"change", 6:"change", 9:"change",
};

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`MTA returned status ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const buffer = await fetchBuffer(ALERTS_URL);
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

    const alerts = [];
    const lineStatus = {};
    const priority = ["suspended","delay","change","planned","good"];

    for (const entity of feed.entity) {
      if (!entity.alert) continue;
      const { alert } = entity;

      const lines = (alert.informedEntity || [])
        .map(e => e.routeId)
        .filter(Boolean);

      const status = EFFECT_MAP[alert.effect] || "change";
      const title = alert.headerText?.translation?.[0]?.text || "Service alert";
      const detail = alert.descriptionText?.translation?.[0]?.text
        ?.replace(/<[^>]+>/g, "") || "";
      const start = alert.activePeriod?.[0]?.start;
      const time = start
        ? new Date(Number(start) * 1000).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit",
          })
        : "Active";

      alerts.push({ id: entity.id, lines, status, title, detail, time });

      for (const line of lines) {
        const cur = lineStatus[line];
        if (!cur || priority.indexOf(status) < priority.indexOf(cur)) {
          lineStatus[line] = status;
        }
      }
    }

    for (const line of ALL_LINES) {
      if (!lineStatus[line]) lineStatus[line] = "good";
    }

    res.json({
      alerts,
      lineStatus,
      updatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("MTA fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
}