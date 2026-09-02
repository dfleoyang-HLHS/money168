# Money168 — 財經趨勢觀察入口

財經指標總覽、數據曲線圖，以及基於 Peter Oppenheimer《進場的訊號》的四階段週期框架。

## 功能

- **第一層：指標總覽** — 重要財經指標卡片（殖利率、VIX、S&P 500、CPI、ISM、失業率）
- **第二層：指標詳情** — 各指標時序曲線圖，支援多時間區間
- **週期框架** — CPI + ISM 關鍵指標、四階段評估、歷史週期回放
- **GitHub JSON 快取** — 資料存於 `data/`，由 Actions 定時更新

## 開發

```bash
npm install
npm run dev
```

開啟 http://localhost:3000

## 資料更新

```bash
# 需要 FRED API Key（免費申請）
export FRED_API_KEY=your_key
npm run update-all
```

或透過 GitHub Actions（`.github/workflows/update-data.yml`）每小時自動更新。

## 專案結構

```
app/                  # Next.js 頁面
components/           # UI 元件
data/                 # JSON 資料（GitHub 快取）
  meta/               # 指標目錄
  dashboard/          # 第一層摘要
  series/             # 時序資料
  cycle/              # 週期框架
scripts/              # 資料抓取與評估腳本
```

## 資料來源

- [FRED](https://fred.stlouisfed.org/) — 殖利率、VIX、S&P 500、CPI、失業率、利差
- ISM PMI — 需手動或第三方來源更新

## 免責聲明

本網站資料與週期框架僅供研究與教育用途，不構成投資建議。
