import { mountWidget } from "skybridge/web";
import { useToolInfo } from "../helpers.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SplitwiseUser {
  id: number;
  name: string;
}

interface SplitwiseSplit {
  user_id: number;
  owed_share: number;
}

interface SplitwiseExpense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  group: string;
  paid_by: number;
  splits: SplitwiseSplit[];
}

interface SplitwiseGroup {
  id: number;
  name: string;
  members: SplitwiseUser[];
  description: string;
}

interface SplitwiseDebt {
  from: number;
  to: number;
  amount: number;
  currency: string;
}

interface SplitwiseData {
  current_user: SplitwiseUser;
  contacts: SplitwiseUser[];
  groups: SplitwiseGroup[];
  debts: SplitwiseDebt[];
  expenses: SplitwiseExpense[];
}

// ─── Fonts ────────────────────────────────────────────────────────────────────

const FONT_LINK = `https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap`;

// ─── Palette (OKLCH, light editorial) ────────────────────────────────────────

const c = {
  // Backgrounds
  bg: "oklch(97% 0.005 60)",          // warm off-white
  bgAlt: "oklch(94% 0.008 60)",       // slightly deeper warm
  surface: "oklch(99% 0.003 60)",     // near-white card

  // Type
  ink: "oklch(18% 0.01 60)",          // near-black, warm
  inkMid: "oklch(42% 0.01 60)",       // mid tone
  inkSub: "oklch(58% 0.01 60)",       // subdued

  // Borders & dividers
  rule: "oklch(88% 0.008 60)",        // thin divider
  border: "oklch(84% 0.01 60)",       // card border

  // Semantic
  posNum: "oklch(38% 0.14 155)",      // forest green — positive amount
  negNum: "oklch(42% 0.18 25)",       // burnt sienna — negative amount
  posBg: "oklch(95% 0.03 155)",
  negBg: "oklch(96% 0.03 25)",

  // Group accent (muted, editorial)
  g101: "oklch(48% 0.12 260)",        // slate blue
  g102: "oklch(52% 0.12 55)",         // amber
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const GROUP_HUE: Record<number, string> = {
  101: c.g101,
  102: c.g102,
};

const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Font Injection ────────────────────────────────────────────────────────────

function FontLoader() {
  return (
    <link
      rel="stylesheet"
      href={FONT_LINK}
      crossOrigin="anonymous"
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 28, accent = c.g101 }: { name: string; size?: number; accent?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `color-mix(in oklch, ${accent} 14%, ${c.bg})`,
        border: `1px solid color-mix(in oklch, ${accent} 30%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 600,
        color: accent,
        flexShrink: 0,
        letterSpacing: "0.04em",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Skeleton (loading state) ─────────────────────────────────────────────────

function Skeleton() {
  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: c.bg,
        width: "100%",
        padding: "28px 20px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { opacity: 1; }
          50% { opacity: 0.45; }
          100% { opacity: 1; }
        }
        .sk { background: ${c.bgAlt}; border-radius: 3px; animation: shimmer 1.6s ease-in-out infinite; }
      `}</style>
      <div className="sk" style={{ width: 120, height: 11, marginBottom: 32 }} />
      <div className="sk" style={{ width: "60%", height: 52, marginBottom: 8 }} />
      <div className="sk" style={{ width: "40%", height: 13, marginBottom: 40 }} />
      {[1,2,3,4].map(i => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <div className="sk" style={{ width: 32, height: 36, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="sk" style={{ width: "70%", height: 12, marginBottom: 6 }} />
            <div className="sk" style={{ width: "45%", height: 10 }} />
          </div>
          <div className="sk" style={{ width: 52, height: 13 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Balance Header ───────────────────────────────────────────────────────────
// Design intent: typography IS the layout. No boxes. Net figure dominates.

function BalanceHeader({ data }: { data: SplitwiseData }) {
  const me = data.current_user;
  const owedToMe = data.debts.filter(d => d.to === me.id).reduce((s, d) => s + d.amount, 0);
  const iOwe = data.debts.filter(d => d.from === me.id).reduce((s, d) => s + d.amount, 0);
  const net = owedToMe - iOwe;
  const isPositive = net >= 0;

  const allUsers = [data.current_user, ...data.contacts];

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Person + label — small, left-aligned */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}>
        <Avatar name={me.name} size={24} accent={c.g101} />
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          color: c.inkSub,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {me.name.split(" ")[0]}'s balance
        </span>
      </div>

      {/* The number — this IS the design */}
      <div style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: "clamp(44px, 12vw, 64px)",
        lineHeight: 1,
        color: isPositive ? c.posNum : c.negNum,
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
        marginBottom: 6,
      }}>
        {isPositive ? "+" : ""}{fmt(net)}
      </div>

      {/* Subtitle line */}
      <div style={{
        fontSize: 13,
        color: c.inkSub,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 400,
        marginBottom: 20,
      }}>
        {isPositive
          ? `You're owed ${fmt(owedToMe)} · you owe ${fmt(iOwe)}`
          : `You owe ${fmt(iOwe)} · you're owed ${fmt(owedToMe)}`}
      </div>

      {/* Individual debts — no cards, just rows */}
      <div style={{ borderTop: `1px solid ${c.rule}` }}>
        {data.debts.map((d, i) => {
          const fromName = allUsers.find(u => u.id === d.from)?.name ?? `User ${d.from}`;
          const toName = allUsers.find(u => u.id === d.to)?.name ?? `User ${d.to}`;
          const isCredit = d.to === me.id;
          const accent = isCredit ? c.posNum : c.negNum;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 0",
                borderBottom: `1px solid ${c.rule}`,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <Avatar name={fromName} size={26} accent={accent} />
              <span style={{ fontSize: 13, color: c.inkMid, flex: 1 }}>
                <span style={{ color: c.ink, fontWeight: 600 }}>{fromName}</span>
                {" owes "}
                <span style={{ color: c.ink, fontWeight: 600 }}>
                  {d.to === me.id ? "you" : toName.split(" ")[0]}
                </span>
              </span>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: accent,
                fontVariantNumeric: "tabular-nums",
              }}>
                {fmt(d.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Groups ───────────────────────────────────────────────────────────────────

function GroupsSection({ data }: { data: SplitwiseData }) {
  return (
    <div style={{ marginBottom: 36 }}>
      {/* Section label */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: c.inkSub,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        marginBottom: 14,
      }}>
        Groups
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {data.groups.map((g, idx) => {
          const accent = GROUP_HUE[g.id] ?? c.g101;
          return (
            <div
              key={g.id}
              style={{
                padding: "14px 0",
                borderTop: `1px solid ${c.rule}`,
                borderBottom: idx === data.groups.length - 1 ? `1px solid ${c.rule}` : undefined,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                {/* Dot indicator — minimal, not heavy left border */}
                <span style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: accent,
                  flexShrink: 0,
                  marginBottom: 1,
                }} />
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: c.ink,
                  flex: 1,
                }}>
                  {g.name}
                </span>
                <span style={{
                  fontSize: 12,
                  color: c.inkSub,
                }}>
                  {g.members.length} members
                </span>
              </div>

              <div style={{ marginLeft: 14, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: c.inkSub, marginBottom: 8 }}>
                  {g.description}
                </div>

                {/* Member row */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {g.members.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Avatar name={m.name} size={20} accent={m.id === data.current_user.id ? accent : c.inkSub} />
                      <span style={{ fontSize: 11, color: c.inkSub }}>
                        {m.name.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

function ExpensesSection({ data }: { data: SplitwiseData }) {
  const allUsers = [data.current_user, ...data.contacts];
  const me = data.current_user;

  const sorted = [...data.expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: c.inkSub,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        marginBottom: 14,
      }}>
        Expenses
      </div>

      <div>
        {sorted.map((exp, idx) => {
          const payer = allUsers.find(u => u.id === exp.paid_by);
          const myShare = exp.splits.find(s => s.user_id === me.id)?.owed_share ?? 0;
          const iDidPay = exp.paid_by === me.id;
          const d = new Date(exp.date);
          const groupId = data.groups.find(g => g.name === exp.group)?.id;
          const accent = groupId ? (GROUP_HUE[groupId] ?? c.g101) : c.inkSub;

          return (
            <div
              key={exp.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "12px 0",
                borderTop: `1px solid ${c.rule}`,
                borderBottom: idx === sorted.length - 1 ? `1px solid ${c.rule}` : undefined,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {/* Date stamp — typographic, no box */}
              <div style={{
                flexShrink: 0,
                width: 28,
                textAlign: "center",
                paddingTop: 1,
              }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: c.ink,
                  lineHeight: 1,
                  fontFamily: "'DM Serif Display', Georgia, serif",
                }}>
                  {d.getDate()}
                </div>
                <div style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: c.inkSub,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}>
                  {MONTH[d.getMonth()]}
                </div>
              </div>

              {/* Description + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: c.ink,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 3,
                }}>
                  {exp.description}
                </div>
                <div style={{
                  fontSize: 11,
                  color: c.inkSub,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  {/* Group dot */}
                  <span style={{
                    display: "inline-block",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: accent,
                  }} />
                  <span>{exp.group}</span>
                  <span style={{ color: c.rule }}>·</span>
                  <span>
                    {iDidPay ? "paid by you" : `paid by ${payer?.name.split(" ")[0] ?? "?"}`}
                  </span>
                </div>
              </div>

              {/* Amounts — right aligned */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: c.ink,
                  fontVariantNumeric: "tabular-nums",
                  marginBottom: 2,
                }}>
                  {fmt(exp.amount)}
                </div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: iDidPay ? c.posNum : c.negNum,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {iDidPay ? "+" : "−"}{fmt(myShare)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Root Widget ──────────────────────────────────────────────────────────────

function SplitwiseWidget() {
  const { output } = useToolInfo<"get_splitwise_data">();

  return (
    <>
      <FontLoader />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${c.bg}; }
      `}</style>

      {!output ? (
        <Skeleton />
      ) : (
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: c.bg,
            width: "100%",
            padding: "28px 20px 40px",
            color: c.ink,
          }}
        >
          {/* App wordmark */}
          <div style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 13,
            color: c.inkSub,
            letterSpacing: "0.05em",
            marginBottom: 28,
          }}>
            Splitwise
          </div>

          <BalanceHeader data={output as unknown as SplitwiseData} />
          <GroupsSection data={output as unknown as SplitwiseData} />
          <ExpensesSection data={output as unknown as SplitwiseData} />
        </div>
      )}
    </>
  );
}

export default SplitwiseWidget;

mountWidget(<SplitwiseWidget />);
