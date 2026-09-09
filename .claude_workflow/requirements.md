# 要件定義: aipa-tiny-react

作成日: 2026-09-09

## 1. 目的

React の内部動作を理解するために、仮想DOM と Hook を自前実装する。
成果物そのものより、**実装を通じた理解**が目的。したがって
「動くコードを速く手に入れる」ことは目的に含めない。

## 2. 現状

- 新規リポジトリ `aipacommander/aipa-tiny-react`（public）
- 実行環境: Node v24.21.0 / npm 11.19.0 / macOS
- 既存資産なし。ゼロから構築する

## 3. スコープ

### 実装する
- `createElement` / `Fragment` による VNode 生成
- VNode ツリーから実DOM への初回描画
- 関数コンポーネントの展開
- 差分更新（diff / patch）と DOM ノードの再利用
- `key` によるリスト差分
- `useState`
- `useEffect`（deps 比較・cleanup・実行タイミング）
- 複数 `setState` のバッチング
- 上記だけで動くデモアプリ（カウンター / TODO）

### 実装しない（YAGNI）
- Fiber アーキテクチャ・work loop・並行レンダリング
- クラスコンポーネント、ライフサイクルメソッド
- Context / Reducer / memo などの周辺 API
- SSR、Suspense、エラーバウンダリ
- JSX パーサーの自作（esbuild に任せる）
- npm パッケージとしての公開

## 4. 制約

- 実装言語は TypeScript
- ビルドは Vite。JSX 変換は esbuild の `jsxFactory` 設定で自作 `createElement` に向ける
- テストは Vitest + happy-dom
- 外部の UI ライブラリ・React 本体には依存しない

## 5. 進め方の要件

- **学習者（ユーザー）が実装する**。Claude は課題文・テスト・型定義・スケルトンを用意する役
- Claude が実装コードを書くのは、ユーザーが明示的に「答え」を求めたときのみ
- ヒントは 3 段階（方向 → アルゴリズム → 擬似コード）で、求められたときだけ出す
- 1 ステップ = 1 課題 = 1 コミット。全 10 ステップ（Step 0〜9）

## 6. 成功基準

1. Step 1〜8 の各テストが全て緑になる
2. Step 9 のデモアプリ（カウンター・TODO）が自作 React のみで動作する
3. 差分更新と key のテストが「DOM ノード参照の保持」で判定され、通る
   （= innerHTML が合うだけの実装では通らない）
4. `docs/notes/` に各ステップの理解メモが残り、後から読み返せる
5. ユーザーが「なぜ Hook は呼び出し順に依存するのか」「なぜ key が必要か」を
   自分の言葉で説明できる状態になる
