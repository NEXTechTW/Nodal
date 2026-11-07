# Nodal

> 開源的捷運、鐵道路線圖編輯器 / 設計器。像向量設計軟體一樣直覺，但專為路線圖而生。

\---

## 1\. 專案目標

打造一個免費、開源、跨平台的捷運路線圖（transit map）編輯器，讓城市愛好者、設計師、遊戲開發者、交通迷與小型機構，不需要 Illustrator 也能做出專業的示意路線圖。

### 核心價值

* **路線圖專用邏輯**：不是通用向量編輯器，而是懂「站、線、轉乘」的編輯器。
* **開放格式**：專案以 JSON 儲存，規格公開，方便版本控制與第三方工具整合。
* **低貢獻門檻**：使用主流 Web 技術，任何會 TypeScript 的人都能參與。

### 非目標（至少 v1 不做）

* 不做真實地理底圖的 GIS 功能
* 不做行車時刻或路徑規劃
* 不做通用繪圖軟體（不取代 Inkscape / Illustrator）

\---

## 2\. 技術選型（已決定）

|層級|選擇|理由|
|-|-|-|
|語言|**TypeScript**（strict）|型別安全，貢獻者最多|
|UI 框架|**React 18+**|生態成熟，面板類介面開發快|
|狀態管理|**Zustand** + 自製 command stack|輕量；undo/redo 需要可控|
|畫布渲染|**SVG**（DOM）|物件可直接選取、天然支援 SVG 匯出；規模達上限再評估 Canvas/WebGL|
|建置工具|**Vite**|快速、設定簡單|
|桌面封裝|**Tauri 2**|體積小、MIT/Apache-2.0 授權|
|測試|**Vitest** + **Playwright**|單元測試與 E2E|
|程式碼品質|ESLint + Prettier + TypeScript strict|統一風格|
|Monorepo|**pnpm workspaces**|核心與 UI 分離|

### 授權：**MIT License**

* 最寬鬆，吸引最多使用者與貢獻者。
* 所有相依套件必須與 MIT 相容（嚴禁引入 GPL / source-available 授權的函式庫）。
* 預設字型使用 **SIL OFL** 授權（例如 Noto Sans）。

\---

## 3\. 架構

```
linewright/
├─ packages/
│  ├─ core/          # 純 TypeScript：資料模型、幾何、命令系統（零 UI 相依）
│  ├─ renderer/      # 將資料模型渲染成 SVG
│  ├─ app/           # React 編輯器 UI
│  └─ schema/        # JSON Schema 與格式版本遷移
├─ apps/
│  ├─ web/           # 網頁版入口
│  └─ desktop/       # Tauri 桌面版
├─ examples/         # 範例路線圖（含虛構城市）
├─ docs/
├─ LICENSE
├─ README.md
└─ CONTRIBUTING.md
```

### 設計原則

1. **資料模型為王**：UI 只是資料的視圖，`core` 不依賴任何 UI 框架，可在 Node 中單獨使用（方便 CLI 與批次匯出）。
2. **Command Pattern**：所有編輯操作都是可逆命令，從第一天就支援 undo/redo。
3. **不可變資料 + 序列化友善**：狀態可直接存成 JSON。
4. **格式有版本號**：每份檔案帶 `schemaVersion`，附遷移函式。

\---

## 4\. 資料模型（草案）

```ts
type ID = string;

interface MetroMap {
  schemaVersion: number;
  meta: { title: string; author?: string; createdAt: string };
  stations: Record<ID, Station>;
  lines: Record<ID, Line>;
  labels: Record<ID, Label>;
  style: MapStyle;
}

interface Station {
  id: ID;
  name: Record<string, string>;      // 多語系，例如 { en: "Central", "zh-TW": "中央" }
  position: { x: number; y: number };
  kind: "normal" | "interchange" | "terminus";
  labelAnchor: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
}

interface Line {
  id: ID;
  name: Record<string, string>;
  color: string;                     // hex
  segments: Segment\\\[];               // 依序連接的站點
  style: "solid" | "dashed" | "double";
}

interface Segment {
  from: ID;                          // Station ID
  to: ID;
  waypoints?: { x: number; y: number }\\\[];  // 轉折點
}
```

\---

## 5\. 路線圖限定功能

* **角度吸附**：路線強制 0° / 45° / 90°（可設定）。
* **圓角轉彎**：可調半徑的折線轉角。
* **平行線並排**：多條路線共用軌道時自動偏移排列。
* **轉乘站**：自動合併、膠囊型 / 圓環型符號。
* **標籤自動避讓**：站名標籤盡量不重疊，並可手動覆寫。
* **多語系站名**：同一站可同時顯示多種語言。
* **匯出**：SVG（主要）、PNG、PDF。

\---

## 6\. 開發路線圖

### v0.1 — 原型（驗證技術）

* \[ ] SVG 畫布：縮放、平移
* \[ ] 新增 / 移動 / 刪除站點
* \[ ] 以拖曳連接站點成路線
* \[ ] 45° 吸附
* \[ ] 匯出 SVG
* \[ ] 儲存 / 載入 JSON

### v0.2 — 可用的編輯器

* \[ ] Undo / Redo（command stack）
* \[ ] 屬性面板、圖層 / 路線清單
* \[ ] 圓角轉彎
* \[ ] 轉乘站

### v0.3 — 專業功能

* \[ ] 平行線並排
* \[ ] 標籤自動避讓
* \[ ] 多語系站名
* \[ ] PNG / PDF 匯出

### v0.4 — 桌面版與生態

* \[ ] Tauri 桌面版打包（Windows / macOS / Linux）
* \[ ] 格式規格文件與 JSON Schema 發佈
* \[ ] 範例與教學

### v1.0

* \[ ] 穩定的檔案格式
* \[ ] 完整文件
* \[ ] 外掛 / 擴充 API 評估

\---

## 7\. 貢獻指南（摘要）

1. Fork 並建立 feature branch
2. `pnpm install` → `pnpm dev`
3. 提交前執行 `pnpm lint \\\&\\\& pnpm test`
4. 使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式
5. 開 PR 並說明變更動機；較大的功能請先開 issue 討論

詳見 `CONTRIBUTING.md`（待建立）。

\---

## 8\. 開源專案基本配備清單

* \[ ] `LICENSE`（MIT）
* \[ ] `README.md`（含 GIF 展示）
* \[ ] `CONTRIBUTING.md`
* \[ ] `CODE\\\_OF\\\_CONDUCT.md`
* \[ ] Issue / PR 範本
* \[ ] GitHub Actions CI（lint、test、build）
* \[ ] 範例地圖與 JSON Schema

\---

## 9\. 風險與注意事項

|風險|對策|
|-|-|
|SVG 元素過多導致卡頓|先做效能基準測試；必要時 renderer 抽換為 Canvas / WebGL（因 renderer 已分層）|
|標籤避讓演算法複雜|v0.3 才處理，先支援手動擺放|
|平行線偏移的幾何邊界情況多|獨立成 `core/geometry` 並大量單元測試|
|真實系統的商標 / 標誌版權|範例只使用虛構城市；文件提醒使用者自負版權責任|
|專案名稱衝突|發佈前搜尋 GitHub / npm / 商標，確認可用|

\---

## 10\. 下一步

1. 建立 GitHub repo（名稱：`linewright`）
2. 初始化 pnpm monorepo、Vite、TypeScript strict
3. 實作 `core` 的資料模型與 command stack
4. 完成 v0.1 原型並錄製示範 GIF

