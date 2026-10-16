
import { useEffect, useState } from "react";
import "./index.css";

const initialForm = {
  birdType: "Broilers",
  birdsPlaced: "500",
  birdsDied: "10",
  birdsSold: "490",
  chickCost: "15000",
  feedCost: "35000",
  vaccineCost: "2500",
  medicineCost: "1500",
  labourCost: "3000",
  transportCost: "2000",
  otherCost: "1000",
  salePrice: "450",
};

const expenseFields = [
  { key: "chickCost", label: "Chicks cost", hint: "Total cost of all chicks" },
  { key: "feedCost", label: "Feed cost", hint: "Starter, grower and finisher" },
  { key: "vaccineCost", label: "Vaccines", hint: "Total vaccination expenses" },
  { key: "medicineCost", label: "Medicine", hint: "Treatment and supplements" },
  { key: "labourCost", label: "Labour", hint: "Workers and other labour costs" },
  { key: "transportCost", label: "Transport", hint: "Delivery and travel costs" },
  { key: "otherCost", label: "Other expenses", hint: "Bedding, water, electricity, etc." },
];

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function money(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function App() {

  const [batchName, setBatchName] = useState("");
const [savedBatches, setSavedBatches] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("kukumargin-batches") || "[]"
    );
  } catch {
    return [];
  }
});

useEffect(() => {
  localStorage.setItem(
    "kukumargin-batches",
    JSON.stringify(savedBatches)
  );
}, [savedBatches]);
  const [form, setForm] = useState(initialForm);
  const [shareMessage, setShareMessage] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);
const [showInstallHelp, setShowInstallHelp] = useState(false);
const [isInstalled, setIsInstalled] = useState(false);

  const update = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "birdsPlaced" || key === "birdsDied") {
        const placed = Math.floor(numberValue(next.birdsPlaced));
        const died = Math.floor(numberValue(next.birdsDied));
        next.birdsSold = String(Math.max(0, placed - died));
      }

      return next;
    });
    setShareMessage("");
  };

  const placed = Math.floor(numberValue(form.birdsPlaced));
  const died = Math.floor(numberValue(form.birdsDied));
  const sold = Math.floor(numberValue(form.birdsSold));

  const totalCost = expenseFields.reduce(
    (sum, field) => sum + numberValue(form[field.key]),
    0
  );

  const survivors = Math.max(0, placed - died);
  const revenue = sold * numberValue(form.salePrice);
  const profit = revenue - totalCost;
  const breakEven = sold > 0 ? totalCost / sold : 0;
  const costPerBird = sold > 0 ? totalCost / sold : 0;
  const validBatch =
    placed > 0 &&
    died <= placed &&
    sold <= survivors &&
    sold > 0;

  const report = [
    "KukuMargin — Poultry Batch Report",
    `Bird type: ${form.birdType}`,
    `Birds placed: ${placed}`,
    `Birds died: ${died}`,
    `Birds surviving: ${survivors}`,
    `Birds sold: ${sold}`,
    `Total costs: ${money(totalCost)}`,
    `Sales revenue: ${money(revenue)}`,
    `Profit / loss: ${money(profit)}`,
    `Break-even price per bird sold: ${money(breakEven)}`,
    `Cost per bird sold: ${money(costPerBird)}`,
    "",
    "Estimate based on the figures entered.",
  ].join("\n");

  async function shareReport() {
    setShareMessage("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "KukuMargin Poultry Report",
          text: report,
        });
        setShareMessage("Report shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
        setShareMessage("Report copied. You can paste it into WhatsApp.");
      } else {
        window.prompt("Copy your report below:", report);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setShareMessage("Sharing was not available. Try again from your browser.");
      }
    }
  }

  function resetForm() {
  setForm(initialForm);
  setBatchName("");
  setShareMessage("");
  }

  function saveBatch() {
  if (!batchName.trim()) {
    alert("Enter a name for this batch first.");
    return;
  }

  if (!validBatch) {
    alert("Check your bird numbers before saving this batch.");
    return;
  }

  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: batchName.trim(),
    savedAt: new Date().toISOString(),
    form: { ...form },
    totalCost,
    revenue,
    profit,
    breakEven,
    costPerBird,
    survivors,
  };

  setSavedBatches((current) => [record, ...current]);
  setBatchName("");
  alert("Batch saved on this device.");
}

function loadBatch(batch) {
  setForm({ ...batch.form });
  setBatchName(batch.name);
  setShareMessage("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteBatch(id) {
  if (!window.confirm("Delete this saved batch?")) return;

  setSavedBatches((current) =>
    current.filter((batch) => batch.id !== id)
  );
}

  useEffect(() => {
  const checkInstalled = () => {
    setIsInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  };

  const handleInstallAvailable = (event) => {
    event.preventDefault();
    setInstallPrompt(event);
  };

  const handleInstalled = () => {
    setIsInstalled(true);
    setInstallPrompt(null);
    setShowInstallHelp(false);
  };

  checkInstalled();

  window.addEventListener("beforeinstallprompt", handleInstallAvailable);
  window.addEventListener("appinstalled", handleInstalled);

  return () => {
    window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
    window.removeEventListener("appinstalled", handleInstalled);
  };
}, []);

async function handleInstallClick() {
  if (!installPrompt) {
    setShowInstallHelp(true);
    return;
  }

  await installPrompt.prompt();
  const choice = await installPrompt.userChoice;

  if (choice.outcome === "accepted") {
    setInstallPrompt(null);
    setShowInstallHelp(false);
  }
}

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="KukuMargin home">
          <span className="brand-icon">KM</span>
          <span>
            <strong>KukuMargin</strong>
            <small>Poultry profit calculator</small>
          </span>
        </a>
        <span className="offline-label">
          <span className="status-dot" />
          No login
        </span>
      </header>


      
{!isInstalled && (
  <section className="install-banner">
    <div className="install-app-icon">KM</div>

    <div className="install-banner-copy">
      <strong>Take KukuMargin with you</strong>
      <p>
        Install the app for quick access to your poultry profit calculator.
      </p>
    </div>

    <button
      type="button"
      className="install-button"
      onClick={handleInstallClick}
    >
      <span>↓</span> Install App
    </button>

    {showInstallHelp && (
      <div className="install-help">
        <strong>Install KukuMargin on Android</strong>
        <p>
          Open this website in Chrome, tap the three-dot menu, then choose
          "Install app" or "Add to Home screen".
        </p>
        <button
          type="button"
          className="install-help-close"
          onClick={() => setShowInstallHelp(false)}
        >
          Got it
        </button>
      </div>
    )}
  </section>
)}

      <section className="hero" id="home">
        
        <div className="hero-copy">
          <span className="eyebrow">YOUR FARM. YOUR NUMBERS.</span>
          <h1>Know your poultry profit before you sell.</h1>
          <p>
            Track your costs, account for mortality and find the selling price
            you need to recover your investment.
          </p>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <span className="sun" />
          <span className="chicken">🐔</span>
          <span className="coin coin-one">KSh</span>
          <span className="coin coin-two">↗</span>
        </div>
      </section>

      <div className="content-grid">
        <section className="panel input-panel">
          <div className="section-heading">
            <div>
              <span className="step-label">STEP 1</span>
              <h2>Your poultry batch</h2>
              <p>Enter the birds and costs for one batch.</p>
            </div>
            <span className="heading-icon">✎</span>
          </div>

          <div className="field">
            <label htmlFor="birdType">Type of chicken</label>
            <select
              id="birdType"
              value={form.birdType}
              onChange={(event) => update("birdType", event.target.value)}
            >
              <option>Broilers</option>
              <option>Improved kienyeji</option>
            </select>
          </div>

          <div className="field-grid">

            <div className="field">
  <label htmlFor="batchName">Batch name</label>
  <input
    id="batchName"
    type="text"
    placeholder="e.g. October Broilers"
    value={batchName}
    onChange={(event) => setBatchName(event.target.value)}
    maxLength={60}
  />
  <small>Give this batch a name you will recognise later.</small>
</div>
            <div className="field">
              <label htmlFor="birdsPlaced">Birds placed</label>
              <input
                id="birdsPlaced"
                type="number"
                min="1"
                step="1"
                value={form.birdsPlaced}
                onChange={(event) => update("birdsPlaced", event.target.value)}
              />
              <small>Chicks started in this batch</small>
            </div>
            <div className="field">
              <label htmlFor="birdsDied">Birds that died</label>
              <input
                id="birdsDied"
                type="number"
                min="0"
                step="1"
                value={form.birdsDied}
                onChange={(event) => update("birdsDied", event.target.value)}
              />
              <small>Enter total mortality</small>
            </div>
          </div>

          <div className="survivor-strip">
            <span className="survivor-icon">🐣</span>
            <span>
              Estimated surviving birds
              <small>Birds placed minus birds that died</small>
            </span>
            <strong>{survivors.toLocaleString("en-KE")}</strong>
          </div>

          <div className="field">
            <label htmlFor="birdsSold">Birds sold</label>
            <input
              id="birdsSold"
              type="number"
              min="0"
              max={survivors}
              step="1"
              value={form.birdsSold}
              onChange={(event) => update("birdsSold", event.target.value)}
            />
            <small>Only count birds already sold or expected to be sold.</small>
          </div>

          <div className="section-heading cost-heading">
            <div>
              <span className="step-label">STEP 2</span>
              <h2>Production expenses</h2>
              <p>Use the total costs for this entire batch.</p>
            </div>
            <span className="heading-icon">KSh</span>
          </div>

          <div className="expenses-list">
            {expenseFields.map((field) => (
              <div className="field expense-field" key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>
                <div className="money-input">
                  <span>KSh</span>
                  <input
                    id={field.key}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form[field.key]}
                    onChange={(event) => update(field.key, event.target.value)}
                  />
                </div>
                <small>{field.hint}</small>
              </div>
            ))}
          </div>

          <div className="total-cost-row">
            <span>Total production costs</span>
            <strong>{money(totalCost)}</strong>
          </div>

          <div className="section-heading sale-heading">
            <div>
              <span className="step-label">STEP 3</span>
              <h2>Sales estimate</h2>
              <p>What do you receive for each bird?</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="salePrice">Selling price per bird (KSh)</label>
            <input
              id="salePrice"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.salePrice}
              onChange={(event) => update("salePrice", event.target.value)}
            />
          </div>

          <div className="form-actions">
  <button
    className="button button-primary"
    onClick={saveBatch}
  >
    Save batch
  </button>

  <button
    className="button button-secondary"
    onClick={shareReport}
  >
    Share report ↗
  </button>

  <button
    className="button button-secondary"
    onClick={resetForm}
  >
    Reset
  </button>
</div>
          {shareMessage && (
            <p className="share-message" role="status">{shareMessage}</p>
          )}


         
<div className="saved-section">
  <div className="saved-heading">
    <div>
      <span className="step-label">YOUR RECORDS</span>
      <h2>Saved batches</h2>
    </div>
    <span className="saved-count">{savedBatches.length}</span>
  </div>

  {savedBatches.length === 0 ? (
    <div className="empty-batches">
      <span>📋</span>
      <strong>No saved batches yet</strong>
      <p>Calculate a batch and tap Save batch to keep its record here.</p>
    </div>
  ) : (
    <div className="saved-list">
      {savedBatches.map((batch) => (
        <article className="saved-batch" key={batch.id}>
          <div className="saved-batch-top">
            <div>
              <strong>{batch.name}</strong>
              <small>
                {batch.form.birdType} ·{" "}
                {new Date(batch.savedAt).toLocaleDateString("en-KE")}
              </small>
            </div>
            <strong className={batch.profit >= 0 ? "saved-profit" : "saved-loss"}>
              {money(batch.profit)}
            </strong>
          </div>

          <div className="saved-details">
            <span>Birds sold: {batch.form.birdsSold}</span>
            <span>Costs: {money(batch.totalCost)}</span>
          </div>

          <div className="saved-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => loadBatch(batch)}
            >
              Open batch
            </button>
            <button
              type="button"
              className="button button-delete"
              onClick={() => deleteBatch(batch.id)}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  )}
</div>

          
        </section>

        <aside className="results-column">
          <section className={`profit-card ${profit >= 0 ? "profit-positive" : "profit-negative"}`}>
            <span className="result-overline">ESTIMATED BATCH RESULT</span>
            <p className="profit-label">{profit >= 0 ? "Estimated profit" : "Estimated loss"}</p>
            <div className="profit-number">{money(profit)}</div>
            <p className="profit-note">
              Revenue minus all expenses entered above.
            </p>
            {!validBatch && (
              <p className="validation-note">
                {placed <= 0
                  ? "Enter the number of birds placed to begin."
                  : died > placed
                    ? "Birds that died cannot exceed birds placed."
                    : sold > survivors
                      ? "Birds sold cannot exceed surviving birds."
                      : sold === 0
                        ? "Enter at least one bird sold to calculate the selling price needed."
                        : "Check your batch figures."}
              </p>
            )}
            <div className="profit-breakdown">
              <div>
                <span>Sales revenue</span>
                <strong>{money(revenue)}</strong>
              </div>
              <div>
                <span>Production costs</span>
                <strong>{money(totalCost)}</strong>
              </div>
            </div>
          </section>

          <section className="panel metrics-panel">
            <div className="section-heading">
              <div>
                <span className="step-label">YOUR NUMBERS</span>
                <h2>Know your targets</h2>
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-icon purple">⚖</div>
              <div className="metric-copy">
                <span>Break-even price</span>
                <small>Per bird sold to cover costs</small>
              </div>
              <strong>{sold > 0 ? money(breakEven) : "—"}</strong>
            </div>
            <div className="metric-row">
              <div className="metric-icon green">₵</div>
              <div className="metric-copy">
                <span>Cost per bird sold</span>
                <small>Total costs ÷ birds sold</small>
              </div>
              <strong>{sold > 0 ? money(costPerBird) : "—"}</strong>
            </div>
            <div className="metric-row">
              <div className="metric-icon orange">↗</div>
              <div className="metric-copy">
                <span>Revenue per bird</span>
                <small>Your entered selling price</small>
              </div>
              <strong>{money(numberValue(form.salePrice))}</strong>
            </div>
            <div className="metric-row">
              <div className="metric-icon blue">🐔</div>
              <div className="metric-copy">
                <span>Mortality rate</span>
                <small>Birds died ÷ birds placed</small>
              </div>
              <strong>
                {placed > 0 ? `${((died / placed) * 100).toFixed(1)}%` : "—"}
              </strong>
            </div>
            <div className="metric-row">
              <div className="metric-icon gold">✓</div>
              <div className="metric-copy">
                <span>Unsold survivors</span>
                <small>Surviving birds minus sold birds</small>
              </div>
              <strong>{Math.max(0, survivors - sold)}</strong>
            </div>
          </section>

          <section className="tip-card">
            <span className="tip-icon">💡</span>
            <div>
              <strong>Farmer's tip</strong>
              <p>
                Before selling, compare your expected price per bird with your
                break-even price. If your price is lower, your batch may make
                a loss.
              </p>
            </div>
          </section>
          <p className="disclaimer">
            Estimates only. Actual results depend on unpaid expenses, unsold
            birds, changes in selling prices and other farm conditions. This
            version does not save your data when you leave or refresh the page.
          </p>
        </aside>
      </div>

      <footer className="footer">
        <div className="brand footer-brand">
          <span className="brand-icon">KM</span>
          <span>
            <strong>KukuMargin</strong>
            <small>Smarter poultry decisions.</small>
          </span>
        </div>
        <span>Made for poultry farmers in Kenya 🇰🇪</span>
      </footer>
    </main>
  );
}
