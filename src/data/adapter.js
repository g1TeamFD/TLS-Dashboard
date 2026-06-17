const BADGE_DEFINITIONS = [
  { key: "memberOfWeek", label: "Member of week", accent: "gold" },
  { key: "mostCurious", label: "Most curious", accent: "blue" },
  { key: "deepestThinker", label: "Deepest thinker", accent: "ink" },
  { key: "mostImproved", label: "Most improved", accent: "green" },
  { key: "mostConsistent", label: "Most consistent", accent: "amber" },
  { key: "highlightedMoment", label: "Highlight", accent: "teal" },
  { key: "comeback", label: "Comeback", accent: "coral" },
];

const SCORE_KEYS = [
  ["effort", "Effort"],
  ["feedback", "Feedback"],
  ["impact", "Impact"],
  ["knowledge", "Knowledge"],
  ["quality", "Quality"],
  ["timeliness", "Timeliness"],
];

const BUBBLE_POSITIONS = [
  { x: 18, y: 34 },
  { x: 42, y: 18 },
  { x: 67, y: 28 },
  { x: 79, y: 56 },
  { x: 56, y: 68 },
  { x: 28, y: 62 },
  { x: 14, y: 74 },
  { x: 74, y: 78 },
  { x: 50, y: 46 },
  { x: 84, y: 18 },
];

const clampText = (value) => (typeof value === "string" ? value.trim() : "");
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const safeNumber = (value) => (isFiniteNumber(value) ? value : null);

function fallbackText(value, placeholder) {
  const text = clampText(value);
  return text || placeholder;
}

function toKey(value, fallback = "unknown") {
  const normalized = clampText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function computeAverage(values) {
  const validValues = values.filter((value) => isFiniteNumber(value));
  if (!validValues.length) return null;
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function formatScore(value) {
  return isFiniteNumber(value) ? Number(value.toFixed(1)) : null;
}

function parseSections(fullSummary) {
  const text = clampText(fullSummary);
  if (!text) return {};

  const matches = [...text.matchAll(/SECTION\s+\d+\s+—\s+([^\n]+)\n?/g)];
  if (!matches.length) return {};

  const sections = {};
  matches.forEach((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    sections[match[1].trim()] = text.slice(start, end).trim();
  });
  return sections;
}

function makeSummarySections(session) {
  const parsedSections = parseSections(session.fullSummary);
  return [
    {
      key: "overview",
      title: "Overview",
      accent: "sun",
      content:
        clampText(session.teaser) ||
        clampText(parsedSections.OVERVIEW) ||
        "Session overview is still being prepared.",
    },
    {
      key: "key-discussions",
      title: "Key discussions",
      accent: "sky",
      content:
        clampText(session.keyTopics) ||
        clampText(parsedSections["KEY DISCUSSIONS & TOPICS"]) ||
        "Key discussion notes are not available yet.",
    },
    {
      key: "sentiment",
      title: "Sentiment & engagement",
      accent: "mint",
      content:
        clampText(parsedSections["SENTIMENT & ENGAGEMENT BY PARTICIPANT"]) ||
        "Sentiment notes are not available for this session yet.",
    },
    {
      key: "actions",
      title: "Open actions",
      accent: "rose",
      content:
        clampText(parsedSections["OPEN ACTIONS & FOLLOW-UPS"]) ||
        "No follow-up actions were recorded for this session.",
    },
  ];
}

function makeThinkingDepth(thinkingDepth) {
  const values = [
    { key: "what", label: "What", count: safeNumber(thinkingDepth.what) ?? 0, pct: safeNumber(thinkingDepth.whatPct) },
    { key: "how", label: "How", count: safeNumber(thinkingDepth.how) ?? 0, pct: safeNumber(thinkingDepth.howPct) },
    { key: "why", label: "Why", count: safeNumber(thinkingDepth.why) ?? 0, pct: safeNumber(thinkingDepth.whyPct) },
  ];

  const total = values.reduce((sum, item) => sum + item.count, 0);
  return values.map((item) => ({
    ...item,
    pct: item.pct ?? (total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : null),
  }));
}

function makeBadges(badges) {
  return BADGE_DEFINITIONS.map((definition) => {
    const badge = badges?.[definition.key] ?? {};
    const winner = clampText(badge.winner);
    const reason = clampText(badge.reason);
    const quote = clampText(badge.quote);
    return {
      ...definition,
      winner,
      reason,
      quote,
      value: safeNumber(badge.value),
      isEmpty: !winner,
    };
  });
}

function makeMembers(members) {
  return (Array.isArray(members) ? members : [])
    .map((member) => {
      const scoreValues = SCORE_KEYS.map(([key]) => safeNumber(member.scores?.[key]));
      const averageScore = safeNumber(member.scores?.meanTalent) ?? computeAverage(scoreValues);
      const trendHistory = Array.isArray(member.trend?.history) ? member.trend.history : [];

      return {
        id: clampText(member.memberName).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: fallbackText(member.memberName, "Unknown member"),
        averageScore: formatScore(averageScore),
        previousScore: safeNumber(member.participation?.prevMeanScore),
        scoreDelta: safeNumber(member.participation?.scoreDelta),
        engagementScore: safeNumber(member.participation?.engagementScore),
        questionCount: safeNumber(member.participation?.questionCount) ?? 0,
        scoreBars: SCORE_KEYS.map(([key, label]) => ({
          key,
          label,
          value: safeNumber(member.scores?.[key]),
        })),
        glow: clampText(member.glowGrow?.glow),
        grow: clampText(member.glowGrow?.grow),
        trend: trendHistory.map((point, index) => ({
          index,
          label: clampText(point.dateIso).slice(5) || `S${index + 1}`,
          value: safeNumber(point.meanTalentScore),
          groupAvg: safeNumber(point.groupAvg),
          groupHigh: safeNumber(point.groupHigh),
        })),
      };
    })
    .sort((left, right) => (right.averageScore ?? -1) - (left.averageScore ?? -1));
}

function makeQuestionCluster(questions) {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  if (!safeQuestions.length) return [];

  const clusterMap = new Map();
  const receivedCounts = new Map();

  safeQuestions.forEach((question) => {
    const receiver = fallbackText(question.receiver, "Open floor");
    receivedCounts.set(receiver, (receivedCounts.get(receiver) ?? 0) + 1);
  });

  safeQuestions.forEach((question) => {
    const asker = fallbackText(question.asker, "Unknown asker");
    if (!clusterMap.has(asker)) {
      clusterMap.set(asker, {
        name: asker,
        questions: [],
        scoreSamples: [],
      });
    }
    const cluster = clusterMap.get(asker);
    const score = safeNumber(question.score);
    if (score !== null) cluster.scoreSamples.push(score);
    cluster.questions.push({
      id: `${asker}-${cluster.questions.length}`,
      receiver: fallbackText(question.receiver, "Open floor"),
      text: clampText(question.questionText),
      rationale: clampText(question.rationaleFeedback),
      score,
      typeLabel: question.type?.isWhy
        ? "Why"
        : question.type?.isHow
          ? "How"
          : question.type?.isWhat
            ? "What"
            : "Open",
      category: fallbackText(question.category, "General"),
    });
  });

  return [...clusterMap.values()]
    .map((cluster, index) => {
      const position = BUBBLE_POSITIONS[index % BUBBLE_POSITIONS.length];
      const avgScore = computeAverage(cluster.scoreSamples);
      const bestQuestion =
        cluster.questions.find((question) => question.text) ??
        cluster.questions[0];
      return {
        id: cluster.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: cluster.name,
        count: cluster.questions.length,
        received: receivedCounts.get(cluster.name) ?? 0,
        avgScore: formatScore(avgScore),
        size: Math.min(124, 56 + cluster.questions.length * 10),
        x: position.x,
        y: position.y,
        questions: cluster.questions,
        bestQuestion,
      };
    })
    .sort((left, right) => right.count - left.count || (right.avgScore ?? -1) - (left.avgScore ?? -1));
}

export function adaptSnapshot(snapshot) {
  const sessions = (Array.isArray(snapshot.sessions) ? snapshot.sessions : []).map((session) => {
    const members = makeMembers(session.members);
    const dateIso = clampText(session.dateIso);
    const dateDisplay = fallbackText(session.dateDisplay, dateIso);
    const topic = clampText(session.topic);
    const topicLabel = fallbackText(topic, "Topic pending");
    const topicFilterLabel = topic || `Topic pending (${dateDisplay})`;

    return {
      id: clampText(session.sessionId),
      dateIso,
      dateDisplay,
      topic,
      topicLabel,
      topicFilterKey: toKey(topic, `session-${dateIso}`),
      topicFilterLabel,
      teaser: clampText(session.teaser),
      host: clampText(session.host),
      guestSpeaker: clampText(session.guestSpeaker),
      guestSpeakerLabel: fallbackText(session.guestSpeaker, "No guest speaker logged"),
      highlightDeferred: true,
      highlight: {
        quote:
          clampText(session.highlight?.quote) ||
          clampText(session.badges?.highlightedMoment?.quote),
        asker:
          clampText(session.highlight?.asker) ||
          clampText(session.badges?.highlightedMoment?.winner),
        score:
          safeNumber(session.highlight?.score) ??
          safeNumber(session.badges?.highlightedMoment?.value),
      },
      kpis: {
        sessionsHeld: safeNumber(session.kpis?.sessionsHeld),
        totalQuestions: safeNumber(session.kpis?.totalQuestions) ?? 0,
        avgEngagement: safeNumber(session.kpis?.avgEngagement),
        activeMembers: safeNumber(session.kpis?.activeMembers) ?? members.length,
      },
      summarySections: makeSummarySections(session),
      members,
      memberLookup: Object.fromEntries(members.map((member) => [member.name, member])),
      badges: makeBadges(session.badges),
      questionClusters: makeQuestionCluster(session.questions),
      thinkingDepth: makeThinkingDepth(session.thinkingDepth ?? {}),
    };
  });

  return {
    snapshotDate: clampText(snapshot.snapshotDate),
    defaultSessionDate: clampText(snapshot.latest10Rule?.defaultSessionDate) || sessions.at(-1)?.dateIso || "",
    topics: [
      ...new Map(
        sessions.map((session) => [
          session.topicFilterKey,
          { key: session.topicFilterKey, label: session.topicFilterLabel },
        ]),
      ).values(),
    ],
    sessions,
  };
}
