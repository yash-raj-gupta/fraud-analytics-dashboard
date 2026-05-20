import { getAnalytics } from "@/lib/analytics";
import { intFmt, inrCompact, pct } from "@/lib/utils";
import { BookOpen, Database, Calculator, Activity, Layers, AlertCircle, GitBranch, Lightbulb } from "lucide-react";

export const dynamic = "force-static";

export default function MethodologyPage() {
  const a = getAnalytics();
  const k = a.kpi;
  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider muted flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" /> Methodology &amp; design notes
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">How this dashboard was built</h1>
        <p className="text-sm muted leading-relaxed">
          A transparent walk-through of every analytical choice — from the synthetic-data generation
          assumptions to the risk-scoring weights — so a reviewer can audit the work end-to-end.
        </p>
      </header>

      <Anchor list={[
        ["#goal", "Goal"],
        ["#data", "Data generation"],
        ["#features", "Feature engineering"],
        ["#kpis", "KPI selection"],
        ["#risk", "Risk scoring"],
        ["#anomaly", "Anomaly detection"],
        ["#tech", "Architecture choices"],
        ["#limits", "Limitations"],
        ["#next", "What I'd do differently"],
      ]} />

      {/* §1 ─────────────────────────────────────────────────────────── */}
      <Section id="goal" icon={Lightbulb} num="§1" title="Goal of the project">
        <p>
          Replicate the analytics surface a junior fraud analyst at a retail bank would actually
          use day-to-day: an executive overview, an investigation surface, a customer-risk queue, a
          merchant surveillance view, and a raw transaction explorer. Every number visible in the UI
          must reconcile to the same SQL aggregate and to the same DAX measure in Power BI — that
          three-way reconciliation is what stakeholders ask for in real reviews.
        </p>
        <Callout tone="default">
          <strong>Decision:</strong> optimize for cross-tool reconciliation over single-tool depth.
          Three implementations of the same risk score (TypeScript, SQL view, DAX) is the entire
          point — it&apos;s how I demonstrate that the analysis isn&apos;t accidentally tied to
          one BI tool&apos;s quirks.
        </Callout>
      </Section>

      {/* §2 ─────────────────────────────────────────────────────────── */}
      <Section id="data" icon={Database} num="§2" title="Synthetic data generation">
        <p>
          The dataset is fully synthetic and seeded — running <code>node dataset/generate.mjs</code>
          on any machine reproduces an identical {intFmt.format(k.totalTransactions)}-row file. I
          chose synthesis over a public Kaggle dump for two reasons: (a) the canonical fraud
          datasets are PCA-anonymized and lose merchant / city / channel context I need to
          demonstrate the dashboards, (b) I can inject realistic risk patterns deliberately so the
          visualizations have signal worth investigating.
        </p>
        <h4 className="font-semibold mt-4">Patterns I baked in</h4>
        <Table
          headers={["Dimension", "Bias", "Why"]}
          rows={[
            ["Hour-of-day", "1–4 AM → 5×, 22:00–01:00 → 2.2×, 09:00–17:00 → 0.6×", "Real-world card fraud peaks during issuer off-hours when 3DS step-up is rarer."],
            ["Weekend", "1.3×", "Higher e-commerce volume on Sat/Sun + slower fraud-ops response."],
            ["Channel", "Online 1.7×, ATM 1.3×, POS 0.9×, UPI 0.6×", "Card-not-present skews fraud rate up; UPI's 2FA + beneficiary checks pull it down."],
            ["Merchant category", "Crypto 5×, Gambling 4.5×, Electronics 2.4×, Travel 1.6×", "Cash-out velocity + low-friction goods are favourites for stolen-card fraud."],
            ["Customer proneness", "5% of customers carry a 4–8× multiplier", "Pareto: a small minority drives most fraud incidents (compromised cards, repeat targets)."],
            ["Compromised merchants", "6% of merchants carry a 4× multiplier", "Mimics POS-skimming or merchant-side data breach."],
            ["Geographic", "Lucknow 1.3×, Delhi 1.25×, Mumbai 1.15×", "Mirrors RBI's Tier-1 fraud reporting profile (illustrative; numbers are not RBI data)."],
            ["Amount of fraud txn", "Bimodal — 30% small probes (₹50–₹500), 70% large extractions (≥₹2,000)", "Standard 'test then drain' attack pattern."],
          ]}
        />
        <p className="mt-3">
          End result: a baseline rate of ~1.4% fraud is amplified by these multiplicative biases up
          to the observed <strong>{pct(k.fraudPercentage, 2)}</strong> headline rate — high
          enough that every chart has visible signal, low enough to feel realistic.
        </p>
      </Section>

      {/* §3 ─────────────────────────────────────────────────────────── */}
      <Section id="features" icon={Layers} num="§3" title="Feature engineering">
        <p>I add four derived columns at load time. Each maps to a specific story the dashboard tells:</p>
        <Table
          headers={["Feature", "Formula", "Used in"]}
          rows={[
            ["transaction_hour", "EXTRACT(HOUR …)", "/fraud heatmap, anomaly scatter, hourly chart"],
            ["weekend_flag", "DAY_OF_WEEK ∈ {Sat, Sun}", "/dashboard weekend-vs-weekday split"],
            ["amount_category", "&lt;₹1k → Small · &lt;₹10k → Medium · ≥₹10k → Large", "/fraud distribution table"],
            ["risk_level", "Banded from risk score (see §5)", "/customers segmentation, drill filters"],
          ]}
        />
        <Callout tone="warn">
          <strong>Why not more features?</strong> Things like rolling 7-day customer velocity, IP-distance,
          device fingerprint, or merchant category code (MCC) lift would absolutely improve a
          production model — but every one of them is unavailable in the source schema we&apos;re
          working with. Adding columns the data can&apos;t support would inflate the work without
          adding signal.
        </Callout>
      </Section>

      {/* §4 ─────────────────────────────────────────────────────────── */}
      <Section id="kpis" icon={Activity} num="§4" title="Why these six headline KPIs">
        <Table
          headers={["KPI", "What it answers", "Why it&apos;s on the executive page"]}
          rows={[
            [`Total Transactions (${intFmt.format(k.totalTransactions)})`, "Activity baseline", "Anchors all rates — no rate makes sense without it."],
            [`Fraud Transactions (${intFmt.format(k.fraudTransactions)})`, "Absolute fraud volume", "Drives staffing decisions in fraud ops."],
            [`Fraud % (${pct(k.fraudPercentage, 2)})`, "Rate, not count", "Removes seasonality — comparable across periods."],
            [`Total Customers (${intFmt.format(k.totalCustomers)})`, "Reach", "Lets you compute fraud per active customer downstream."],
            [`Avg. Transaction Value (₹${Math.round(k.averageTransactionValue).toLocaleString("en-IN")})`, "Money flowing", "Fraud rate is meaningless without value context."],
            [`Total Fraud Amount (${inrCompact.format(k.totalFraudAmount)})`, "Loss exposure", "The number the CFO actually cares about."],
          ]}
        />
        <p className="mt-3">
          What I deliberately <em>didn&apos;t</em> include on the headline strip: median txn value
          (added complexity for marginal insight), distinct merchants (operational, not executive),
          chargeback ratio (not in the source schema). All three live in deeper drill-throughs
          where they&apos;re actually actionable.
        </p>
      </Section>

      {/* §5 ─────────────────────────────────────────────────────────── */}
      <Section id="risk" icon={Calculator} num="§5" title="Customer risk scoring">
        <p>The PRD specifies a weighted-sum scorecard. I implement it identically across all three layers:</p>
        <Formula>
          {`risk_score = 0.5 × normalized(fraud_count)
           + 0.3 × normalized(fraud_amount)
           + 0.2 × normalized(transaction_frequency)`}
        </Formula>
        <p>Each component is min-max normalized to 0–100 against the population maximum, so the score is bounded [0, 100]. Bucket cuts:</p>
        <Table
          headers={["Score range", "Bucket", "Meaning"]}
          rows={[
            ["≥ 80", "High", "Top decile of risk — manual review queue."],
            ["50–79", "Medium", "Watch list — soft authentication step-up."],
            ["< 50", "Low", "Frictionless flow."],
          ]}
        />
        <h4 className="font-semibold mt-4">Why these weights?</h4>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong>0.5 on fraud count.</strong> Repeat fraud is the single strongest signal —
            once a customer&apos;s card has been used fraudulently, the probability of recurrence
            spikes. Half the score should reflect that.
          </li>
          <li>
            <strong>0.3 on fraud amount.</strong> A small handful of large losses can dwarf a
            high-frequency low-value pattern. We can&apos;t ignore Rupee impact, but we also
            can&apos;t let one ₹5L incident drown out a customer with steady ₹500 fraud over
            twelve months.
          </li>
          <li>
            <strong>0.2 on transaction frequency.</strong> Acts as an exposure prior — heavy
            users have more <em>opportunities</em> to be defrauded, so all else equal they deserve
            slightly elevated scrutiny. This is the term I&apos;d most likely <em>drop</em> in a
            v2 model since it correlates with normal customer value.
          </li>
        </ol>
        <Callout tone="warn">
          <strong>Honest caveat.</strong> A weighted-sum scorecard is the simplest defensible
          baseline — gradient-boosted trees on the same features would almost certainly beat it on
          AUC. The argument for the simpler model: regulators and compliance teams need to be
          able to explain &quot;why was this customer flagged High&quot; in plain English. The
          weights here let me say &quot;0.5 × your fraud count, plus…&quot; — try doing that with a
          1,000-tree XGBoost.
        </Callout>
      </Section>

      {/* §6 ─────────────────────────────────────────────────────────── */}
      <Section id="anomaly" icon={AlertCircle} num="§6" title="Anomaly detection approach">
        <p>Two complementary techniques surface the &quot;needle in the haystack&quot; transactions:</p>
        <h4 className="font-semibold mt-4">a. Per-customer z-score on amount</h4>
        <Formula>{`z = (amount - μ_customer) / σ_customer
flag when |z| > 3 AND n ≥ 5`}</Formula>
        <p>
          Catches the ₹50k charge on a card that normally runs ₹200–₹2,000 — the classic indicator
          of a stolen-card extraction. The <code>n ≥ 5</code> floor stops noise from new customers
          with too few datapoints to baseline against.
        </p>
        <h4 className="font-semibold mt-4">b. Velocity check via LAG window</h4>
        <p>
          For each customer&apos;s ordered transaction history, compute time-since-previous. Two
          fraud transactions within 24 hours from the same customer is a high-precision compromise
          signal — small probe charge followed by full extraction. SQL implementation is in
          <code> sql/08_anomaly_detection.sql</code>.
        </p>
        <Callout tone="default">
          <strong>What&apos;s missing for production:</strong> a real fraud system layers Isolation
          Forest (unsupervised novelty), Random Forest / XGBoost (supervised with labels), and
          graph-based ring detection on top of these heuristics. The Python notebook in the
          roadmap (<code>python/fraud_model.ipynb</code>) ports the first two; ring detection
          needs a graph database.
        </Callout>
      </Section>

      {/* §7 ─────────────────────────────────────────────────────────── */}
      <Section id="tech" icon={GitBranch} num="§7" title="Architecture decisions">
        <Table
          headers={["Decision", "Why", "When I&apos;d change it"]}
          rows={[
            ["CSV + in-memory aggregator (no DB)", "Demo deploys to Vercel as static + serverless. Zero infra cost.", "≥ 5M rows, or any need for persistent writes — swap to Postgres or DuckDB."],
            ["Server components prerender /dashboard, /fraud", "Heavy aggregation runs once at build time, not per request. ~50 ms TTFB.", "When data needs to be live (real-time stream)."],
            ["Memoized AnalyticsBundle", "Avoids re-parsing 100K rows on every API call.", "When schema changes per-tenant — would need keyed cache."],
            ["No external chart library beyond Recharts", "Single dependency, dark-mode aware, server-friendly.", "If 3D maps or large geo overlays are needed."],
            ["Mock client-side auth", "Recruiter doesn&apos;t need to type real creds; no PII risk.", "Always before exposing anything sensitive."],
            ["TypeScript end-to-end", "Same types from CSV row to chart prop — refactor confidence.", "Never."],
          ]}
        />
      </Section>

      {/* §8 ─────────────────────────────────────────────────────────── */}
      <Section id="limits" icon={AlertCircle} num="§8" title="Honest limitations">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Synthetic data is synthetic.</strong> The fraud rate (~{pct(k.fraudPercentage, 2)})
            is intentionally above industry average (~0.6–1.5%) for visibility. A version trained on a
            real bank&apos;s data would surface much subtler patterns.
          </li>
          <li>
            <strong>No real-time pipeline.</strong> Everything is batch — refresh = rebuild. A
            production fraud platform needs Kafka/Kinesis ingestion, sub-100ms scoring, and a
            feature store keeping the customer aggregates fresh.
          </li>
          <li>
            <strong>No model performance section.</strong> I don&apos;t have a held-out validation
            set with confusion matrix / ROC-AUC, because there&apos;s no ML model yet — only
            heuristics. The Python module on the roadmap addresses this.
          </li>
          <li>
            <strong>Risk score is unsupervised.</strong> The weights are heuristic, not learned.
            They&apos;re defensible, but a logistic regression trained on labelled fraud would
            almost certainly find different optimal weights.
          </li>
          <li>
            <strong>Auth is mock.</strong> Real banking needs SSO + MFA + role-based access — not
            in scope for a portfolio demo, but explicitly called out so a reviewer doesn&apos;t
            mistake the omission for negligence.
          </li>
          <li>
            <strong>Compliance gaps.</strong> No audit log of analyst actions, no PII redaction
            layer, no PCI-DSS / RBI evidence trail. All catalogued in <code>docs/ARCHITECTURE.md</code>
            under &quot;For real banking deployment&quot;.
          </li>
        </ul>
      </Section>

      {/* §9 ─────────────────────────────────────────────────────────── */}
      <Section id="next" icon={Lightbulb} num="§9" title="What I'd do differently in v2">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Replace the weighted-sum risk score with gradient-boosted trees,</strong> keeping
            the simple model as the explainable fallback for compliance asks. Two-tier model:
            fast/explainable for default flow, accurate/opaque for high-stakes review.
          </li>
          <li>
            <strong>Add a streaming demo</strong> — a 1-second tick injecting a fresh transaction,
            scored live, animated into the dashboard. Visually impressive and a much closer match
            to real fraud-ops UX.
          </li>
          <li>
            <strong>Build a network view</strong> — customers and merchants as nodes, fraud edges,
            PageRank to surface mule accounts. The juiciest analytical territory and one most
            portfolios skip because it&apos;s hard.
          </li>
          <li>
            <strong>Replace 100K with 5M rows.</strong> Force the architecture conversation: when
            does the in-memory aggregator break, what&apos;s the right swap (DuckDB? Postgres
            materialized views? a feature store?), and how do I prove the swap doesn&apos;t change
            the numbers.
          </li>
          <li>
            <strong>Ship a printable analyst pack.</strong> Weekly PDF generated from the dashboard
            via Playwright — what fraud ops would actually read. Closes the loop from interactive
            tool to operational artifact.
          </li>
        </ol>
        <Callout tone="default">
          The deliberate philosophy throughout this build: <strong>simple things that reconcile
          across tools beat sophisticated things in one tool.</strong> A reviewer should be able to
          re-derive every number from the SQL or the Power BI report and get the same answer. That
          discipline is what separates a portfolio project from a useful one.
        </Callout>
      </Section>
    </div>
  );
}

/* ─── Reusable presentational helpers ─────────────────────────────── */

function Anchor({ list }: { list: [string, string][] }) {
  return (
    <nav className="surface p-4 flex flex-wrap gap-2 text-xs">
      <span className="muted uppercase tracking-wider mr-2">Jump to</span>
      {list.map(([href, label]) => (
        <a key={href} href={href} className="hover:text-accent muted transition-colors">
          {label}
        </a>
      ))}
    </nav>
  );
}

function Section({
  id,
  icon: Icon,
  num,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="surface p-6 md:p-8 scroll-mt-24 space-y-3 leading-relaxed text-sm">
      <header className="flex items-center gap-3 pb-2 border-b mb-3">
        <div className="w-9 h-9 rounded-lg border flex items-center justify-center text-accent border-accent/30">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider muted">{num}</p>
          <h2 className="font-semibold tracking-tight text-lg">{title}</h2>
        </div>
      </header>
      <div className="prose-sm space-y-3">{children}</div>
    </section>
  );
}

function Callout({ tone, children }: { tone: "default" | "warn"; children: React.ReactNode }) {
  const cls =
    tone === "warn"
      ? "border-l-warning bg-warning/5"
      : "border-l-accent bg-accent/5";
  return (
    <div className={`border-l-4 ${cls} px-4 py-3 rounded-r-md text-sm`}>{children}</div>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre className="font-mono text-xs surface p-3 overflow-x-auto whitespace-pre-wrap">
      {children}
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide muted bg-[var(--bg)]">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium" dangerouslySetInnerHTML={{ __html: h }} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-[var(--bg)]">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2 align-top"
                  dangerouslySetInnerHTML={{ __html: cell }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
