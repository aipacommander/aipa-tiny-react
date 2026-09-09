# aipa-tiny-react

React の仕組みを理解するために、仮想DOM と Hook（useState / useEffect）を自前で実装する学習用リポジトリ。

- 実装言語: TypeScript
- ビルド: Vite（JSX 変換は esbuild に任せ、`jsxFactory` を自作 `createElement` に向ける）
- テスト: Vitest + happy-dom

## 進め方

1 ステップ 1 課題。`docs/steps/NN-*.md` の課題文を読み、`src/tiny-react/` を実装し、`tests/NN-*.test.ts` が緑になったら次へ進む。

| # | テーマ |
|---|--------|
| 0 | 環境構築 |
| 1 | createElement と VNode |
| 2 | 初回描画（mount） |
| 3 | 関数コンポーネント |
| 4 | 差分更新（diff / patch） |
| 5 | key によるリスト差分 |
| 6 | useState |
| 7 | useEffect |
| 8 | 再描画のバッチング |
| 9 | デモアプリで総合確認 |
