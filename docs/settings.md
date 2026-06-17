# 設定画面 要件定義・仕様メモ

本ドキュメントは、実装が完了した設定画面の仕様を整理したものです。今後の機能追加やメンテナンス時にAIおよび開発者が参照できるように記録しています。

## 1. 概要 (Overview)
- **機能**: アプリケーションの表示テーマ（フレームワーク風スタイル）の選択、配色モード（ライト/ダーク/OS連動）の切り替え、および外部 API (mirakc) の接続先設定を行う。
- **保存先**: ブラウザのローカルストレージ（キー単位で個別に保存）。

---

## 2. 実装済み機能 (Implemented Features)

### 2.1 テーマと配色の切り替え
- **テーマの種類 (`Theme`)**: `material`, `bootstrap`, `indigo`, `fluent` の4種類から選択可能。
- **テーマの配色 (`ThemeVariant`)**:
  - `ライト`: ライトモード固定
  - `ダーク`: ダークモード固定
  - `OSのデフォルト`: OSの配色設定（`prefers-color-scheme`）に連動して動的切り替え。
- **動作**: 設定を保存した際にテーマおよび配色がアプリ全体に適用される。

### 2.2 外部連携設定 (mirakc接続先)
- `mirakc` の API エンドポイント URL を指定可能。
- 未指定（空欄）の場合は、このアプリが動作している配信元ホスト（`window.location.origin`）の `api/` をデフォルト接続先とする。

### 2.3 UI構造とナビゲーション
- 上部ヘッダーと左メニューは、アプリ共通の Web Components である `<mrv-navbar>` および `<mrv-nav-drawer>` を使用。

---

## 3. 画面レイアウト (UI Layout)

フォームは上から順番に設定項目が並び、最下部に保存ボタンが配置される縦並びの構成。

```text
[ヘッダー (mrv-navbar)]
[左メニュー (mrv-nav-drawer)]

■ テーマ
  ( ) material  ( ) bootstrap  ( ) indigo  ( ) fluent

■ テーマの配色
  ( ) ライト  ( ) ダーク  ( ) OSのデフォルト

--------------------------------------------------
■ mirakc接続先
  [ http://example.com/api/                      ]
  (通常変更する必要はありません / 不正なURL時はエラー表示)

--------------------------------------------------
[ 保存 ]
```

---

## 4. データ構造と保存仕様 (Data Structure)

### 4.1 ローカルストレージキー
設定値は `miraview.config.` から始まるキーで個別に保存する（JSONによる構造化は行わない）。

| 設定項目 | ローカルストレージキー | 保存される値 |
| :--- | :--- | :--- |
| テーマ | `miraview.config.theme` | `'material' \| 'bootstrap' \| 'indigo' \| 'fluent'` |
| 配色 | `miraview.config.themeVariant` | `'light' \| 'dark'` (OSデフォルト時はキーごと削除) |
| mirakc接続先 | `miraview.config.mirakcApiEndpoint` | URL文字列 (未指定時はキーごと削除) |

### 4.2 テーマ適用ロジック
CSS の読み込みは、設定されたテーマと配色に基づいて、動的に `<link>` タグの `href` を書き換えることで適用する。
また、Ignite UI の内部スタイルも `configureTheme(theme, variant)` を呼び出すことで同期する。

```typescript
// CSSの適用パスのイメージ
`./themes/${variant}/${theme}.css`
```
