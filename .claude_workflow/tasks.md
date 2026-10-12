# タスク: aipa-tiny-react

作成日: 2026-09-09
前提: `.claude_workflow/design.md`

## 担当の凡例

- **[C]** Claude が実施
- **[U]** ユーザー（学習者）が実施
- 実装コードは原則 [U]。Claude が書くのはユーザーが「答え」と言ったときのみ

## 各ステップ共通のサイクル（Step 1〜8）

1. **[C]** 課題文 `docs/steps/NN-*.md` を書く（目的・作るもの・受け入れ条件・つまずきポイント）
2. **[C]** テスト `tests/NN-*.test.tsx` を書く
3. **[C]** スケルトン（シグネチャと JSDoc のみ、中身は `throw new Error('not implemented')`）を置く
4. **[C]** `npm test` で**該当テストが赤になること**を確認 → コミット & push
5. **[U]** 実装する。詰まったら「ヒント」（3段階）／「答え」
6. **[C]** 緑を確認 → コードレビュー → `docs/notes/NN-*.md` に解説 → コミット & push

---

## Step 0: 環境構築 【C】

- [x] T0-1 `npm init` と依存追加（vite 8 / typescript 7 / vitest 5 / happy-dom 20）
- [x] T0-2 `tsconfig.json`（strict, jsx: react + jsxFactory, ES2022）
- [x] T0-3 `vite.config.ts`（**oxc** の jsx pragma、vitest の happy-dom 設定）
- [x] T0-4 `src/tiny-react/types.ts` — VNode / Instance / Hook の型定義（**仕様として Claude が用意**）
- [x] T0-5 `index.html` と `src/demo/main.ts` のプレースホルダ
- [x] T0-6 `tests/00-setup.test.ts` — 疎通確認（happy-dom で document が触れること）
- [x] T0-7 `npm test` / `npm run typecheck` が緑になることを確認 → コミット & push

受け入れ条件: `npm test` が通り、`npm run dev` でページが開く

---

## Step 1: createElement と VNode

- [x] T1-C 課題文・テスト・スケルトン（`src/tiny-react/create-element.ts`）
- [x] T1-U 実装
- [x] T1-R レビューと解説

検証内容: children の平坦化 / 文字列・数値のテキストノード化 / `null`・`undefined`・`boolean` の除去 /
`key` の抽出 / `Fragment` の平坦展開
補足: このステップのテストのみ `createElement` を直接呼ぶ（JSX はまだ使えないため）

## Step 2: 初回描画（mount）

- [x] T2-C 課題文・テスト・スケルトン（`dom.ts`, `reconciler.ts` の mount, `index.ts` の render）
- [x] T2-U 実装
- [x] T2-R レビューと解説

検証内容: タグ生成 / テキストノード / 属性・`className` / `on*` イベント登録 / `style` オブジェクト /
ネストした子要素 / `render()` で container に入ること

## Step 3: 関数コンポーネント

- [x] T3-C 課題文・テスト・スケルトン（reconciler の component 分岐）
- [x] T3-U 実装
- [x] T3-R レビューと解説

検証内容: 関数が props 付きで呼ばれる / 入れ子コンポーネント / `props.children` の受け渡し /
要素以外を返したら例外

## Step 4: 差分更新（diff / patch）

- [ ] T4-C 課題文・テスト・スケルトン（`patch`, `unmount`, `getDom`）
- [ ] T4-U 実装
- [ ] T4-R レビューと解説

検証内容: **DOM ノードが再利用される（参照同一性）** / props の追加・変更・削除 /
イベントハンドラの張り替え / type が変わったら作り直し / 子の増減
注意: ここから Step 1〜3 のテストも回し続ける

## Step 5: key によるリスト差分

- [ ] T5-C 課題文・テスト・スケルトン
- [ ] T5-U 実装
- [ ] T5-R レビューと解説

検証内容: 並べ替えでノードが保持される / 先頭挿入で既存ノードが作り直されない / 削除 /
key なしのときのインデックス対応（従来動作の維持）

## Step 6: useState

- [ ] T6-C 課題文・テスト・スケルトン（`hooks.ts`, reconciler 側の currentInstance 受け渡し）
- [ ] T6-U 実装
- [ ] T6-R レビューと解説

検証内容: 状態が描画をまたいで保持される / 複数 Hook の独立性 / 関数形式の setState /
遅延初期化 / コンポーネント外呼び出しで例外 / Hook 個数が変わったら例外
この段階では再描画は同期でよい

## Step 7: useEffect

- [ ] T7-C 課題文・テスト・スケルトン
- [ ] T7-U 実装
- [ ] T7-R レビューと解説

検証内容: 初回実行 / deps 未指定は毎回 / `[]` は 1 回 / deps 変化時のみ再実行 /
再実行前に cleanup / unmount 時に cleanup / **DOM 反映後に実行される順序**

## Step 8: バッチング

- [ ] T8-C 課題文・テスト・スケルトン（`scheduler.ts`）
- [ ] T8-U 実装
- [ ] T8-R レビューと解説

検証内容: 同一タスク内の setState 3 回で再描画 1 回 / 複数コンポーネントの同時更新 /
microtask 後には DOM が最新になっている

## Step 9: デモアプリ 【U 主体】

- [ ] T9-C デモの要件を課題文に書く（カウンター / TODO 追加・削除・並べ替え）
- [ ] T9-U `src/demo/` を自作 React だけで実装
- [ ] T9-R 動作確認とレビュー
- [ ] T9-F README に成果とスクリーンショットを追記、全体の振り返りを `docs/notes/` に

---

## 進捗

現在: **Step 3 完了。Step 4 の課題提示待ち**

| Step | 状態 |
|------|------|
| 0 環境構築 | 完了 |
| 1 createElement | 完了 |
| 2 mount | 完了 |
| 3 component | 完了 |
| 4 patch | 未着手 |
| 5 key | 未着手 |
| 6 useState | 未着手 |
| 7 useEffect | 未着手 |
| 8 batching | 未着手 |
| 9 demo | 未着手 |
