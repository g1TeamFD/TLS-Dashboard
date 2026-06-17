import { useEffect, useState, useTransition } from "react";
import snapshotUrl from "./data/tls-dashboard-data.json?url";
import { adaptSnapshot } from "./data/adapter";
import "./styles.css";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const driveImage = (id, size = 1000) => `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
const logoTls = driveImage("1uqPqnIYCfXqZMmzzjYX6gjYO8iYn4vmo", 420);
const logoFdYlab = driveImage("1uNijlNAGtM0zSzj9wjVX-vnV6UwIR-U9", 760);
const avatarImage = (id) => driveImage(id, 320);
const HOST_AVATARS = {
  ELF: avatarImage("1cyc39zvDSKQpmnZi06odJ4Hq5rJqTYMS"),
  BLCOP: avatarImage("119AIrYvQpXRXUJW599YszqxoyoA2BaNv"),
  JFP: avatarImage("1snPxTyqmNwKxVQhUKOUzNhCG1-zOwK-N"),
  GIANI: avatarImage("1cujcVpjVXQQvZ3jV8ps0dGKtWa2xZtls"),
};
const MEMBER_AVATARS = {
  ALE: avatarImage("1ibh8Qsda_0kkOBttZ2Uhys2UCAI-mv-i"),
  BLCOP: avatarImage("119AIrYvQpXRXUJW599YszqxoyoA2BaNv"),
  ELF: avatarImage("1cyc39zvDSKQpmnZi06odJ4Hq5rJqTYMS"),
  GIANI: avatarImage("1cujcVpjVXQQvZ3jV8ps0dGKtWa2xZtls"),
  INTAN: avatarImage("1m4Y6Jjcokz6aejHKPIid0AU3mMaDym2Q"),
  JAYDEN: avatarImage("1Awb-6I9PSH1hbYrAfwHr2NKIFG2gfh3q"),
  JFP: avatarImage("1snPxTyqmNwKxVQhUKOUzNhCG1-zOwK-N"),
  KYLA: avatarImage("1LG9raPaGo-oRw6S9e24OIwrcskjKSjDI"),
  LUNA: avatarImage("1diq02p5N40zcjm9p4LFC1jtsp3QOrXtS"),
  RATNA: avatarImage("1Td9Z9_2lhto08iQ5lxILcuOQva52bNPH"),
  WIATI: avatarImage("1baLkoHg5P9L3k7J5u16pB8uA64oeVD1K"),
};
const BUBBLE_COLORS = ["#F06449", "#2EC4B6", "#9B89B4", "#E8973A", "#52B788", "#1479A8", "#C89200"];

// ─── COMPONENTS ────────────────────────────────────────────────────────────────

function previewText(value, max = 120) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "No details recorded yet.";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function KPITile({ icon, label, value, decimals, unit = "", iconBg, delay }) {
  const [disp, setDisp] = useState(0);

  useEffect(() => {
    setDisp(0);
    const t = setTimeout(() => {
      const dur = 950, t0 = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - t0) / dur, 1);
        setDisp(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  const str = decimals ? disp.toFixed(decimals) : Math.floor(disp);
  return (
    <div className="kpi">
      <div className="kico" style={{ background: iconBg }}>{icon}</div>
      <div>
        <div className="kval">{str}{unit}</div>
        <div className="klbl">{label}</div>
      </div>
    </div>
  );
}

function BadgeCard({ emoji, title, winner, reason, noWinner, color, avatarUrl, onOpen }) {
  return (
    <div
      className="bw"
      onClick={onOpen}
      title={noWinner ? "No winner this session" : "Click for full details"}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="bmedal" style={{ "--badge-color": color }}>
        <div className="hover-card badge-hover-card">
          <div className="hover-eyebrow">Badge Preview</div>
          <div className="hover-title">{title}</div>
          <div className="hover-line"><span>Winner</span><strong>{noWinner ? "No winner" : winner}</strong></div>
          <div className="hover-copy">{noWinner ? "No winner this session yet." : previewText(reason, 112)}</div>
          <div className="hover-action">Click for full details</div>
        </div>
        <div className="medal-ribbons" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="medal-face">
          {avatarUrl
            ? <img className="badge-avatar" src={avatarUrl} alt={winner} />
            : <div className="bemoji">{emoji}</div>
          }
        </div>
        <div className="medal-copy">
          <div className="btitle">{title}</div>
          <div className={`bwin${noWinner ? " bnone" : ""}`}>
            {noWinner ? "—" : winner}
          </div>
        </div>
      </div>
    </div>
  );
}


const APP_VERSION = "v0.7.0";

const BADGE_DEFS = [
  { key: "memberOfWeek",      emoji: "🏆", title: "Weekly MVP",       color: "#C89200" },
  { key: "mostCurious",       emoji: "❓", title: "Curiosity Spark",  color: "#1479A8" },
  { key: "deepestThinker",    emoji: "🧠", title: "Deep Thinker",     color: "#7B68A4" },
  { key: "mostImproved",      emoji: "📈", title: "Growth Climber",   color: "#3A9E6F" },
  { key: "mostConsistent",    emoji: "🎯", title: "Steady Star",      color: "#C07D2A" },
  { key: "highlightedMoment", emoji: "💬", title: "Highlight Hero",   color: "#1EA89C" },
  { key: "comeback",          emoji: "🌟", title: "Comeback Star",    color: "#C84E34" },
];

const MEMBER_COLORS = ["#F06449", "#2EC4B6", "#9B89B4", "#E8973A", "#52B788", "#1479A8", "#C89200", "#7B68A4"];
const SECTION_ICONS = ["📋", "🔍", "✨", "✅", "📊"];

function normalizeMemberKey(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function compactMissing(value) {
  return typeof value === "string" && value.trim() && value.trim().toLowerCase() !== "not available";
}

function normalizeHostName(value) {
  return normalizeMemberKey(value);
}

function initials(value, fallback = "?") {
  const parts = String(value || "").split(/\s+/).filter(Boolean);
  const picked = parts.length > 1 ? parts.slice(-2) : parts;
  return picked.map((part) => part[0]?.toUpperCase() ?? "").join("") || fallback;
}

function protoMembers(session) {
  return session.members.map((member, index) => {
    const score = member.averageScore ?? 0;
    const bars = Object.fromEntries(member.scoreBars.map((bar) => [bar.key, (bar.value ?? 0) / 5]));
    return {
      id: member.id || `m-${index}`,
      name: member.name,
      initials: initials(member.name, "NA"),
      color: MEMBER_COLORS[index % MEMBER_COLORS.length],
      score,
      bars,
      trend: member.trend.map((point, pointIndex) => ({
        s: point.label || `S${pointIndex + 1}`,
        v: point.value ?? score,
        avg: point.groupAvg,
        high: point.groupHigh,
      })),
      glow: member.glow || "Awaiting glow note for this member.",
      grow: member.grow || "Awaiting growth note for this member.",
    };
  });
}

function protoSections(session) {
  const mapped = session.summarySections.map((section, index) => ({
    icon: SECTION_ICONS[index] || "📌",
    title: section.title,
    content: section.content,
  }));

  return mapped.length ? mapped : [{ icon: "📋", title: "Overview", content: "Session overview is still being prepared." }];
}

function protoBubbleData(session) {
  return session.questionClusters.map((cluster) => ({
    name: cluster.name,
    asked: cluster.count,
    received: cluster.received,
    quality: cluster.avgScore ?? 0,
    questions: cluster.questions.map((question) => ({
      q: question.text || "Question text missing.",
      feedback: question.rationale || "No rationale feedback was recorded.",
    })),
  }));
}

function protoSession(session) {
  const depthMap = Object.fromEntries(session.thinkingDepth.map((item) => [item.key, item.pct ?? 0]));
  const badges = Object.fromEntries(session.badges.map((badge) => [badge.key, {
    member: badge.isEmpty ? "" : badge.winner,
    reason: badge.reason || badge.quote || "No reason recorded yet.",
  }]));

  return {
    id: session.dateIso,
    date: session.dateDisplay,
    topic: session.topicLabel,
    guestSpeaker: compactMissing(session.guestSpeaker) ? session.guestSpeaker : null,
    guestSpeakerAvatar: null,
    host: session.host || "Host pending",
    hostAvatar: HOST_AVATARS[normalizeHostName(session.host)] || null,
    bubbleData: protoBubbleData(session),
    sections: protoSections(session),
    stats: {
      sessions: session.kpis.sessionsHeld ?? 0,
      questions: session.kpis.totalQuestions ?? 0,
      avgEngagement: session.kpis.avgEngagement ?? 0,
      activeMembers: session.kpis.activeMembers ?? session.members.length,
    },
    depth: {
      what: depthMap.what ?? 0,
      how: depthMap.how ?? 0,
      why: depthMap.why ?? 0,
    },
    questionsPerMember: session.questionClusters.map((cluster) => ({ name: cluster.name, value: cluster.count })),
    badges,
  };
}

function LoadingShell({ text }) {
  return (
    <div className="dash">
      <div className="card" style={{ gridRow: "1 / -1", display: "grid", placeItems: "center" }}>{text}</div>
    </div>
  );
}

const BAR_SEGMENTS = [
  { key: "effort",     label: "Effort Spent",        color: "#1B3A8C" },
  { key: "feedback",   label: "Feedback",             color: "#1E7A50" },
  { key: "impact",     label: "Impact",               color: "#C8A800" },
  { key: "knowledge",  label: "Knowledge Application",color: "#C84E34" },
  { key: "quality",    label: "Quality",              color: "#C8D2DA" },
  { key: "timeliness", label: "Timeliness",           color: "#00C8DC" },
];

const MAX_SCORE = 10;

function MemberBarChart({ members, activeMid, onSelect }) {
  const sorted = [...members].sort((a, b) => b.score - a.score);
  const compactRows = sorted.length >= 10;
  const rowCount = sorted.length || 1;
  const visibleRows = Math.max(rowCount, Math.min(8, Math.max(4, rowCount)));
  const fitStyle = {
    "--member-count": rowCount,
    "--visible-rows": visibleRows,
    "--rows-height": `${Math.min(100, (rowCount / visibleRows) * 100)}%`,
    "--row-gap": `${Math.max(1, Math.min(4, 28 / rowCount))}px`,
    "--row-pad-y": `${Math.max(0, Math.min(3, 18 / rowCount - 1))}px`,
    "--row-pad-x": `${Math.max(2, Math.min(5, 36 / rowCount))}px`,
    "--name-font": `${Math.max(7.4, Math.min(9, 90 / rowCount))}px`,
    "--track-height": `${Math.max(6, Math.min(10, 96 / rowCount))}px`,
    "--score-font": `${Math.max(8, Math.min(11, 108 / rowCount))}px`,
  };
  return (
    <div
      className={`mbar-layout${compactRows ? " compact" : ""}${rowCount <= 3 ? " low-member" : ""}`}
      style={fitStyle}
    >
      <div className="mbar-rows">
        {sorted.map(m => {
          // Each segment's share of the TOTAL score (sum of all bars = the score)
          const total = Object.values(m.bars).reduce((s, v) => s + v, 0) || 1;
          // The filled portion of the track is score/10 of full width
          const trackFill = (m.score / MAX_SCORE) * 100; // e.g. 8.4 → 84%
          return (
            <div
              key={m.id}
              className={`mbar-row${activeMid === m.id ? " active" : ""}`}
              onClick={() => onSelect(m.id)}
              title={`Open details for ${m.name}`}
            >
              <div className="mbar-name" style={{ color: m.color }}>
                {m.name}
              </div>

              {/* Track: grey background, filled portion contains stacked coloured segments */}
              <div className="mbar-track">
                <div className="mbar-fill" style={{ width: `${trackFill}%` }}>
                  {BAR_SEGMENTS.map(seg => {
                    const segPct = (m.bars[seg.key] / total) * 100;
                    return (
                      <div
                        key={seg.key}
                        className="mbar-seg"
                        style={{ width: `${segPct}%`, background: seg.color }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="mbar-score" style={{ color: m.color }}>{m.score.toFixed(1)}</div>
              <div className="hover-card mbar-hover-card">
                <div className="hover-eyebrow">Member Detail</div>
                <div className="hover-title">{m.name}</div>
                <div className="hover-line"><span>Total score</span><strong>{m.score.toFixed(1)}/10</strong></div>
                <div className="hover-bars">
                  {BAR_SEGMENTS.map(seg => (
                    <div key={seg.key} className="hover-bar-row">
                      <span className="hover-dot" style={{ background: seg.color }} />
                      <span className="hover-bar-label">{seg.label}</span>
                      <strong>{((m.bars[seg.key] ?? 0) * 5).toFixed(1)}</strong>
                    </div>
                  ))}
                </div>
                <div className="hover-action">Click for member details</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mbar-legend">
        {BAR_SEGMENTS.map(seg => (
          <div key={seg.key} className="mleg-item">
            <div className="mleg-dot" style={{ background: seg.color }} />
            {seg.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, chart = false }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`detail-modal${chart ? " chart-modal" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-hdr">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close detail pop-up">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function MemberDetail({ member, allMembers }) {
  // build avg and highest lines from all members' trends
  const sessions = member.trend.map(t => t.s);
  const trendData = sessions.map((s, i) => {
    const vals = allMembers.map(m => m.trend[i]?.v ?? 0);
    return {
      s,
      v: member.trend[i].v,
      avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
      high: Math.max(...vals),
    };
  });

  return (
    <div className="mdetail">
      <div className="mdetail-score">{member.score.toFixed(1)} / 10</div>
      <div className="mtrend-lbl">Score over time</div>
      <div className="modal-chart">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="s"
            tick={{ fontSize: 10, fontFamily: "Nunito", fill: "#8A909A" }}
            axisLine={false} tickLine={false}
          />
          <YAxis hide domain={[4, 10]} />
          <Tooltip
            contentStyle={{ fontSize: "11px", fontFamily: "Nunito", borderRadius: "7px", border: "1px solid #eee", padding: "5px 9px" }}
            formatter={(v, name) => [v.toFixed(1), name === "v" ? member.name : name === "avg" ? "Group avg" : "Highest"]}
          />
          {/* avg line */}
          <Line type="monotone" dataKey="avg" stroke="#C8D2DA" strokeWidth={1.5}
            strokeDasharray="3 2" dot={false} name="avg" />
          {/* highest line */}
          <Line type="monotone" dataKey="high" stroke="#E8973A" strokeWidth={1.5}
            strokeDasharray="3 2" dot={false} name="high" />
          {/* member line */}
          <Line type="monotone" dataKey="v" stroke={member.color} strokeWidth={2.5}
            dot={{ fill: member.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 4.5 }} name="v" />
        </LineChart>
        </ResponsiveContainer>
      </div>

      {/* legend */}
      <div style={{ display: "flex", gap: "10px", marginTop: "-2px", flexShrink: 0 }}>
        {[
          { color: member.color, label: member.name, dash: false },
          { color: "#E8973A",    label: "Highest",   dash: true },
          { color: "#C8D2DA",    label: "Avg",        dash: true },
        ].map(({ color, label, dash }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="16" height="6">
              <line x1="0" y1="3" x2="16" y2="3"
                stroke={color} strokeWidth="2"
                strokeDasharray={dash ? "3 2" : "none"}
              />
            </svg>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#8A909A" }}>{label}</span>
          </div>
        ))}
      </div>

      <div className="mglow-pill">
        <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>✨</span>
        <div>
          <div style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".5px", color: "#236B46", marginBottom: "2px" }}>Glow</div>
          <div style={{ fontSize: "12px", lineHeight: 1.5, color: "#2A3A2A" }}>{member.glow}</div>
        </div>
      </div>
    </div>
  );
}


function AvatarCircle({ avatar, initials, gradient }) {
  return (
    <div className="sp-avatar" style={{ background: gradient }}>
      {avatar
        ? <img src={avatar} alt={initials} />
        : <div className="sp-avatar-placeholder">{initials}</div>
      }
    </div>
  );
}

function SpeakerHostCard({ session }) {
  const guestInitials = session.guestSpeaker
    ? session.guestSpeaker.split(" ").filter(w => /^[A-Z]/.test(w)).slice(-2).map(w => w[0]).join("")
    : "?";
  const hostInitials = session.host
    ? session.host.split(" ").filter(w => /^[A-Z]/.test(w)).slice(-2).map(w => w[0]).join("")
    : "H";

  return (
    <div className="spcard">
      {/* Host */}
      <div className="sp-slot">
        <AvatarCircle
          avatar={session.hostAvatar}
          initials={hostInitials}
          gradient="linear-gradient(135deg,#2EC4B6 0%,#1EA89C 100%)"
        />
        <div className="sp-info">
          <div className="sp-role host">🎙 Host</div>
          <div className="sp-name">{session.host || "—"}</div>
        </div>
      </div>

      <div className="sp-divider" />

      {/* Guest Speaker */}
      <div className="sp-slot">
        <AvatarCircle
          avatar={session.guestSpeakerAvatar}
          initials={guestInitials}
          gradient="linear-gradient(135deg,#F06449 0%,#E8973A 100%)"
        />
        <div className="sp-info">
          <div className="sp-role guest">🎤 Guest speaker</div>
          {session.guestSpeaker
            ? <div className="sp-name">{session.guestSpeaker}</div>
            : <div className="sp-none">No guest this session</div>
          }
        </div>
      </div>
    </div>
  );
}

function BadgeDetail({ emoji, title, winner, reason, noWinner, color }) {
  return (
    <div className="badge-detail">
      <div className="badge-detail-emoji">{emoji}</div>
      <div className="badge-detail-title" style={{ color }}>{title}</div>
      <div className={`badge-detail-winner${noWinner ? " bnone" : ""}`}>{noWinner ? "No winner this session" : winner}</div>
      <div className="badge-detail-reason">
        {noWinner ? "No comeback story this session. We're watching." : reason}
      </div>
    </div>
  );
}

function BubbleQuestionDetail({ member, color }) {
  return (
    <div className="bq-panel">
      <div className="bq-list">
        {member.questions.map((item, i) => (
          <div key={i} className="bq-item">
            <div className="bq-q">"{item.q}"</div>
            <div className="bq-fb-lbl">💬 Feedback</div>
            <div className="bq-fb">{item.feedback}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionBubbleChart({ data, onSelectMember, selectedName }) {
  if (!data.length) {
    return <div className="bubble-empty">No question data for this session.</div>;
  }

  const W = 680, H = 306;
  const PAD = { top: 24, right: 24, bottom: 48, left: 54 };
  const BUBBLE_EDGE_PAD = 42;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const bubblePlotW = Math.max(1, plotW - BUBBLE_EDGE_PAD * 2);
  const bubblePlotH = Math.max(1, plotH - BUBBLE_EDGE_PAD * 2);

  const maxAsked    = Math.max(...data.map(d => d.asked), 4);
  const maxReceived = Math.max(...data.map(d => d.received), 5);
  const maxQuality  = Math.max(...data.map(d => d.quality), 10);
  const minQuality  = Math.min(...data.map(d => d.quality), 0);

  const scaleX = v => PAD.left + BUBBLE_EDGE_PAD + (v / maxAsked) * bubblePlotW;
  const scaleY = v => PAD.top + BUBBLE_EDGE_PAD + bubblePlotH - (v / maxReceived) * bubblePlotH;
  const scaleGridX = v => PAD.left + (v / maxAsked) * plotW;
  const scaleGridY = v => PAD.top + plotH - (v / maxReceived) * plotH;
  const scaleR = v => 12 + ((v - minQuality) / (maxQuality - minQuality + 0.01)) * 22;

  const [hovered, setHovered] = useState(null);

  const xTicks = Array.from({ length: maxAsked + 1 }, (_, i) => i);
  const yTicks = Array.from({ length: maxReceived + 1 }, (_, i) => i);

  return (
    <div className="bubble-wrap" style={{ width: "100%", height: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="bubble-svg" preserveAspectRatio="xMidYMid meet" style={{ display: "block", width: "100%", height: "100%" }}>
        {/* Grid lines */}
        {yTicks.map(v => (
          <line key={`gy${v}`} x1={PAD.left} y1={scaleGridY(v)} x2={PAD.left + plotW} y2={scaleGridY(v)} stroke="#F0EDE8" strokeWidth="0.5" />
        ))}
        {xTicks.map(v => (
          <line key={`gx${v}`} x1={scaleGridX(v)} y1={PAD.top} x2={scaleGridX(v)} y2={PAD.top + plotH} stroke="#F0EDE8" strokeWidth="0.5" />
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#C8D2DA" strokeWidth="0.8" />
        <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="#C8D2DA" strokeWidth="0.8" />

        {/* X ticks */}
        {xTicks.map(v => (
          <text key={`xt${v}`} x={scaleGridX(v)} y={H - 6} textAnchor="middle"
            style={{ fontSize: "11px", fill: "#69707B", fontFamily: "Nunito", fontWeight: 800 }}>{v}</text>
        ))}
        {/* Y ticks */}
        {yTicks.map(v => (
          <text key={`yt${v}`} x={PAD.left - 3} y={scaleGridY(v) + 1.5} textAnchor="end"
            style={{ fontSize: "11px", fill: "#69707B", fontFamily: "Nunito", fontWeight: 800 }}>{v}</text>
        ))}

        {/* Axis labels */}
        <text x={PAD.left + plotW} y={H - 2} textAnchor="end"
          style={{ fontSize: "15px", fill: "#69707B", fontFamily: "Nunito", fontWeight: 900, letterSpacing: "0" }}>
          How many Questions asked?
        </text>
        <text x={14} y={PAD.top + 4} textAnchor="end"
          transform={`rotate(-90, 14, ${PAD.top + 4})`}
          style={{ fontSize: "15px", fill: "#69707B", fontFamily: "Nunito", fontWeight: 900, letterSpacing: "0" }}>
          How many Questions received?
        </text>

        {/* Bubbles */}
        {data.map((d, i) => {
          const cx = scaleX(d.asked);
          const cy = scaleY(d.received);
          const r  = scaleR(d.quality);
          const isHov = hovered === i;
          const isSelected = selectedName === d.name;
          const color = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
          const shortName = d.name.split(" ")[0];
          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectMember(d)}
              style={{ cursor: "pointer" }}>
              <circle
                className="bubble-dot"
                cx={cx} cy={cy} r={isSelected ? r + 2 : r}
                fill={color}
                fillOpacity={isHov || isSelected ? 0.95 : 0.72}
                stroke={color}
                strokeWidth={isSelected ? 2 : isHov ? 1.5 : 0.5}
                strokeOpacity={isSelected ? 1 : 0.6}
                style={{ transition: "all .18s" }}
              />
              <text x={cx} y={cy + 1.8} textAnchor="middle"
                style={{ fontSize: r > 18 ? "10px" : "9px", fill: "#fff", fontFamily: "Nunito", fontWeight: 900, pointerEvents: "none", letterSpacing: "0" }}>
                {shortName}
              </text>
              {/* "click" hint ring pulse on hover */}
              {isHov && !isSelected && (
                <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 2" />
              )}
            </g>
          );
        })}
      </svg>
      {hovered !== null && data[hovered] && (() => {
        const x = scaleX(data[hovered].asked);
        const y = scaleY(data[hovered].received);
        const edge = 130;
        const placeRight = x < edge;
        const placeLeft = x > W - edge;
        const placeBelow = y < 112;
        return (
          <div
            className={`hover-card bubble-hover-card${placeBelow ? " below" : " above"}${placeRight ? " right" : ""}${placeLeft ? " left" : ""}`}
            style={{
              "--bubble-tip-x": `${(x / W) * 100}%`,
              "--bubble-tip-y": `${(y / H) * 100}%`,
              "--bubble-tip-offset-x": placeRight ? "12px" : placeLeft ? "calc(-100% - 12px)" : "-50%",
              "--bubble-tip-offset-y": placeBelow ? "14px" : "calc(-100% - 14px)",
            }}
          >
            <div className="hover-eyebrow">Question Detail</div>
            <div className="hover-title">{data[hovered].name}</div>
            <div className="hover-line"><span>Asked</span><strong>{data[hovered].asked}</strong></div>
            <div className="hover-line"><span>Received</span><strong>{data[hovered].received}</strong></div>
            <div className="hover-line"><span>Avg quality</span><strong>{Number(data[hovered].quality || 0).toFixed(1)}</strong></div>
            <div className="hover-action">Click for question details</div>
          </div>
        );
      })()}
    </div>
  );
}

function Chart2Legend({ data }) {
  return (
    <div className="bubble-legend" aria-label="Question chart member legend">
      {data.map((item, index) => (
        <div key={item.name} className="bubble-legend-item">
          <span className="bubble-legend-dot" style={{ background: BUBBLE_COLORS[index % BUBBLE_COLORS.length] }} />
          <span className="bubble-legend-name">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────

function App() {
  const [model, setModel] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [sid, setSid] = useState("");
  const [mid, setMid] = useState(null);
  const [modal, setModal] = useState(null);
  const [secIdx, setSecIdx] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isActive = true;
    async function loadSnapshot() {
      try {
        const response = await fetch(snapshotUrl);
        if (!response.ok) throw new Error(`Snapshot load failed with status ${response.status}`);
        const snapshot = await response.json();
        if (!isActive) return;
        const nextModel = adaptSnapshot(snapshot);
        setModel(nextModel);
        setSid(nextModel.defaultSessionDate);
      } catch (error) {
        if (!isActive) return;
        setLoadError(error instanceof Error ? error.message : "Snapshot load failed.");
      }
    }
    loadSnapshot();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    if (!model?.sessions.length) return;
    if (!model.sessions.some((entry) => entry.dateIso === sid)) {
      setSid(model.sessions[0].dateIso);
    }
  }, [model, sid]);

  if (loadError) return <LoadingShell text={loadError} />;
  if (!model) return <LoadingShell text="Loading local TLS snapshot..." />;

  const liveSession = model.sessions.find((entry) => entry.dateIso === sid) ?? model.sessions[0];
  if (!liveSession) return <LoadingShell text="No session matches the current filter." />;

  const session = protoSession(liveSession);
  const members = protoMembers(liveSession);
  const modalMember = modal?.type === "member" ? members.find(m => m.id === modal.memberId) : null;
  const modalBadge = modal?.type === "badge" ? modal.badge : null;
  const modalBubble = modal?.type === "bubble" ? modal.member : null;
  const selectedBubbleName = modal?.type === "bubble" ? modal.member.name : null;

  return (
    <div className="dash-shell">
      <div className={`dash${modal ? " dash-blurred" : ""}`}>
        <div className="brand-logos" aria-label="Program logos">
          <img className="brand-logo tls-logo" src={logoTls} alt="TLS logo" />
          <img className="brand-logo fd-logo" src={logoFdYlab} alt="FD Ylab logo" />
        </div>

        {/* ── HEADER */}
        <header className="hdr">
          <div className="hdr-brand">
            <span>GLOBAL CITIZENS PROGRAM</span>
            <small>The Expo 2026 Scoreboard</small>
          </div>
          <div className="hdr-filter">
            <select
              className="sel session-sel"
              value={liveSession.dateIso}
              onChange={e => { startTransition(() => setSid(e.target.value)); setMid(null); setModal(null); setSecIdx(0); }}
            >
              {model.sessions.map(s => (
                <option key={s.dateIso} value={s.dateIso}>{s.dateDisplay} · {s.topicLabel}</option>
              ))}
            </select>
          </div>
        </header>

        {/* ── KPI ROW */}
        <div className="kpis">
          <SpeakerHostCard session={session} />
          <KPITile icon="⚡" label="Avg engagement"   value={session.stats.avgEngagement}   decimals={1} unit="/10" iconBg="#F3F0FA" delay={140} />
          <KPITile icon="👥" label="Active members"   value={session.stats.activeMembers}   iconBg="#ECF9F3" delay={210} />
        </div>

        {/* ── MIDDLE */}
        <div className="mid">

          {/* Session Summary */}
          <div className="card">
            <div className="ctitle">📋 Session summary</div>

            {/* Section navigator */}
            {(() => {
              const sections = session.sections;
              const sec = sections[secIdx];
              return (
                <>
                  <div className="snav">
                    <button
                      className="snav-btn"
                      disabled={secIdx === 0}
                      onClick={() => setSecIdx(i => i - 1)}
                      aria-label="Previous section"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M8.5 3L5 7l3.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    <div className="snav-pills">
                      {sections.map((s, i) => (
                        <div
                          key={i}
                          className={`snav-dot${i === secIdx ? " active" : ""}`}
                          onClick={() => setSecIdx(i)}
                          title={s.title}
                        />
                      ))}
                    </div>

                    <button
                      className="snav-btn"
                      disabled={secIdx === sections.length - 1}
                      onClick={() => setSecIdx(i => i + 1)}
                      aria-label="Next section"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5.5 3L9 7l-3.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  <div className="ssec" key={secIdx}>
                    <div className="ssec-hdr">
                      <span className="ssec-icon">{sec.icon}</span>
                      <span className="ssec-title">{sec.title}</span>
                    </div>
                    <div className="ssec-body">{sec.content}</div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Member Performance */}
          <div className="card member-card" style={{ position: "relative" }}>
            <div className="ctitle">🌟 Chart 1. Talent Component</div>
            <MemberBarChart members={members} activeMid={mid} onSelect={(memberId) => { setMid(memberId); setModal({ type: "member", memberId }); }} />
          </div>
        </div>

        {/* ── BOTTOM */}
        <div className="bot">

          {/* Badges */}
          <div className="bcard">
            <div className="ctitle" style={{ marginBottom: "7px" }}>🏅 Badges</div>
            <div className="bgrid">
              {BADGE_DEFS.map(def => {
                const bd = session.badges[def.key];
                const badgeWinner = bd?.member || "—";
                const avatarUrl = bd?.member ? MEMBER_AVATARS[normalizeMemberKey(bd.member)] : null;
                return (
                  <BadgeCard
                    key={def.key}
                    emoji={def.emoji}
                    title={def.title}
                    winner={badgeWinner}
                    reason={bd?.reason || ""}
                    noWinner={!bd || !bd.member}
                    color={def.color}
                    avatarUrl={avatarUrl}
                    onOpen={() => setModal({
                      type: "badge",
                      badge: {
                        emoji: def.emoji,
                        title: def.title,
                        winner: badgeWinner,
                        reason: bd?.reason || "",
                        noWinner: !bd || !bd.member,
                        color: def.color,
                      },
                    })}
                  />
                );
              })}
            </div>
          </div>

          {/* Charts Panel */}
          <div className="cpanel" style={{ position: "relative" }}>

            {/* Bubble Chart: question interaction map */}
            <div className="chart2-layout">
              <div className="chart2-copy">
                <div className="clbl">🎯 Chart 2. Questions</div>
                <div className="chart-helper">
                  Bubble size shows question quality
                </div>
              </div>
              <div className="bubble-chart-frame">
                <QuestionBubbleChart
                  data={session.bubbleData}
                  onSelectMember={d => setModal({ type: "bubble", member: d })}
                  selectedName={selectedBubbleName}
                />
              </div>
              <Chart2Legend data={session.bubbleData} />
            </div>
          </div>
        </div>

      </div>
      <div className="screen-gate" role="status" aria-live="polite">
        <div className="screen-gate-panel">
          <div className="screen-gate-title">Please use a computer or laptop</div>
          <div className="screen-gate-copy">
            This dashboard is best viewed on a computer or laptop. Please open it on a larger screen to see all charts, badges, and session details clearly.
          </div>
        </div>
      </div>
      {modalMember && (
        <Modal
          title={modalMember.name}
          subtitle="Member performance"
          chart
          onClose={() => { setModal(null); setMid(null); }}
        >
          <MemberDetail member={modalMember} allMembers={members} />
        </Modal>
      )}
      {modalBadge && (
        <Modal title={modalBadge.title} subtitle="Badge detail" onClose={() => setModal(null)}>
          <BadgeDetail {...modalBadge} />
        </Modal>
      )}
      {modalBubble && (() => {
        const COLORS = ["#F06449","#2EC4B6","#9B89B4","#E8973A","#52B788","#1479A8","#C89200"];
        const idx = session.bubbleData.findIndex(d => d.name === modalBubble.name);
        const color = COLORS[idx % COLORS.length];
        return (
          <Modal
            title={modalBubble.name}
            subtitle={`${modalBubble.questions.length} question${modalBubble.questions.length !== 1 ? "s" : ""} · Q score ${modalBubble.quality}`}
            onClose={() => setModal(null)}
          >
            <BubbleQuestionDetail member={modalBubble} color={color} />
          </Modal>
        );
      })()}
    </div>
  );
}

export default App;
