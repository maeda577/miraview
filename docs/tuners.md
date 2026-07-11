# チューナー一覧画面 仕様メモ

本ドキュメントは、チューナー一覧画面の要件およびUI/UXの仕様案をまとめたものです。

## 1. 概要 (Overview)
- **機能**: 外部 API (mirakc) からチューナー情報の一覧を取得し、各チューナーの現在の利用状況（状態、割り当てコマンド、利用中のユーザー情報など）をリアルタイムに確認・手動更新する。
- **配置先**: アプリケーションの左メニューに「チューナー」項目を追加し、そこから遷移可能とする。

---

## 2. 機能仕様 (Features)

### 2.1 チューナー一覧の取得と表示
- `mirakc` API の `/tuners` エンドポイントからデータを取得します。
- 取得したチューナー情報を、チューナーごとにカード形式（`igc-card`）で一覧表示します。

### 2.2 状態表示（バッジ）
各チューナーの利用状況を `igc-badge` を用いて色分けして表示します。
- **Free (空き)**:
  - チューナーが使用されていない状態 (`isFree === true`)
  - バッジのスタイル: `variant="success"` (緑色)
- **Using (使用中 - 優先度0以下)**:
  - チューナーが使用中で、接続しているすべてのユーザーの優先度（`priority`）が `0` 以下の場合。
  - バッジのスタイル: `variant="warning"` (オレンジ色)
- **Using (使用中 - 優先度1以上)**:
  - チューナーが使用中で、接続しているユーザーのうち少なくとも1人の優先度が `1` 以上の場合。
  - バッジのスタイル: `variant="danger"` (赤色)

### 2.3 最新情報への手動更新
- 画面上部に「最新の情報に更新」ボタンを配置します。
- ボタンクリック時に API から再取得を行い、画面を更新します。
- データ取得中（ロード中）はローディングスピナー（`igc-circular-progress`）を表示します。

---

## 3. 画面レイアウト (UI Layout)

画面上部に更新ボタンを配置し、その下にチューナーカードがレスポンシブなグリッドレイアウトで並ぶ構成とします。

```text
[ヘッダー (mrv-navbar: タイトル「チューナー」)]
[左メニュー (mrv-nav-drawer: 「チューナー」項目がアクティブ)]

■ メインコンテンツ領域
  [ 最新の情報に更新 (igc-button) ]

  +--------------------------------------------+  +--------------------------------------------+
  | Tuner 0                   [ Free (Badge) ] |  | Tuner 1                  [ Using (Badge) ] |
  | GR : BS : CS                               |  | GR                                         |
  |                                            |  |                                            |
  | Command: recpt1 --b25 --strip --device...  |  | Command: recpt1 --b25 --strip --device...  |
  |                                            |  |                                            |
  |                                            |  | Users:                                     |
  |                                            |  | - User ID: 127.0.0.1:54321                 |
  |                                            |  |   Priority: 1                              |
  |                                            |  |   User Agent: Mirakurun/3.9.0              |
  +--------------------------------------------+  +--------------------------------------------+
```

---

## 4. コンポーネントとデータ構造 (Components & Data Structure)

### 4.1 使用する Ignite UI Web Components
- `<igc-button>`: 「最新の情報に更新」ボタン
- `<igc-card>`, `<igc-card-header>`, `<igc-card-content>`: チューナー情報の表示用カード
- `<igc-badge>`: 状態（Free / Using）表示バッジ
- `<igc-circular-progress>`: データロード中のスピナー

### 4.2 API データ構造 (`MirakurunTuner`)
`openapi-fetch` 経由で取得する `/tuners` のデータ（`components['schemas']['MirakurunTuner']`）は以下の通りです。

| プロパティ | 型 | 説明 |
| :--- | :--- | :--- |
| `name` | `string` | チューナーの名称 |
| `types` | `string[]` | 対応する放送波種別 (`GR`, `BS`, `CS`, `SKY` など) |
| `command` | `string | null` | チューナーを実行しているコマンド |
| `isFree` | `boolean` | 空き状態かどうか |
| `users` | `TunerUser[]` | 現在接続しているユーザーのリスト |

#### `TunerUser` のデータ構造
- `id` (`string`): ユーザーID（通常は接続元IPとポートなど）
- `priority` (`number`): 優先度
- `agent` (`string | null`): 接続クライアントの User Agent
