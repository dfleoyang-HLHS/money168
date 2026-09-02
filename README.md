# Money168 — 財經趨勢觀察入口

財經指標總覽、數據曲線圖，以及基於 Peter Oppenheimer《進場的訊號》的四階段週期框架。

## 功能

- **第一層：指標總覽** — 殖利率、VIX、S&P 500、CPI、ISM、失業率
- **第二層：指標詳情** — 互動式時序曲線圖
- **週期框架** — CPI + ISM、四階段評估、歷史週期回放
- **GitHub JSON 快取** — 資料存於 `data/`，Actions 定時更新

## 開發

```bash
npm install
npm run dev          # http://localhost:3000
```

## 資料更新

```bash
cp .env.example .env.local   # 填入 API Keys（可選）
npm run update-all           # 抓取全部資料 + 週期評估 + 摘要重建
npm run fetch-ism            # 僅更新 ISM PMI
```

### API Keys（可選）

| 變數 | 用途 | 申請 |
|------|------|------|
| `FRED_API_KEY` | 殖利率、VIX、CPI、失業率等 | [FRED 免費申請](https://fred.stlouisfed.org/docs/api/api_key.html) |
| `TRADING_ECONOMICS_API_KEY` | ISM 完整歷史（可選，增強） | [Trading Economics](https://tradingeconomics.com/api/) |

**ISM 資料來源（無需 API Key）：**

- [DBnomics ISM/pmi](https://db.nomics.world/ISM/pmi) — 官方 ISM 提供者，免費
- [Bellwether 開源資料集](https://github.com/RealMaxPower/bellwether) — 1948 年至今歷史補全

## 部署

### Vercel（推薦）

1. 將 repo 連接到 [Vercel](https://vercel.com)
2. 設定 Environment Variables：`FRED_API_KEY`（可選）
3. Deploy — 每次 push 自動部署

### GitHub Pages

1. Repo **Settings → Pages → Source** 選 **GitHub Actions**
2. 合併到 `main` 分支後，`Deploy to GitHub Pages` workflow 自動執行
3. 網址：`https://<username>.github.io/money168/`

### 自動資料更新

`.github/workflows/update-data.yml` 每小時執行：

1. 從 FRED / DBnomics / Bellwether 抓取資料
2. 更新 `data/series/*.json`
3. 重算週期評估與 Dashboard 摘要
4. Commit 並 push（觸發重新部署）

在 GitHub Secrets 設定：

- `FRED_API_KEY`
- `TRADING_ECONOMICS_API_KEY`（可選）

## 專案結構

```
app/                  # Next.js 頁面
components/           # UI 元件
data/                 # JSON 資料（GitHub 快取）
  meta/               # 指標目錄
  dashboard/          # 第一層摘要
  series/             # 時序資料（含 ism.json）
  cycle/              # 週期框架
scripts/
  fetch-and-update.js # 主資料管道
  fetch-ism.js        # ISM PMI 多來源抓取
  calculate-cycle-assessment.js
  build-dashboard-summary.js
.github/workflows/
  update-data.yml     # 定時更新資料
  deploy.yml          # GitHub Pages 部署
```

## 免責聲明

本網站資料與週期框架僅供研究與教育用途，不構成投資建議。
