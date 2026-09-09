# 設計: aipa-tiny-react

作成日: 2026-09-09
前提: `.claude_workflow/requirements.md`

## 1. アーキテクチャ方針

Preact 風の**再帰レンダラ**を採用する。Fiber（work loop / 中断可能レンダリング）は採らない。

理由:
- 要件のスコープ（仮想DOM + useState/useEffect）に対して work loop は主題ではなく、
  読む量が増える割に「なぜ再描画されるのか」の理解には寄与しない
- 再帰であれば呼び出しスタックがそのままツリー構造に対応し、デバッガで追える

## 2. 中心となるデータ構造

2 種類のツリーを区別する。ここが設計の要。

### VNode — 「今回こう描きたい」という設計図（毎回作り直される・不変）

```ts
type Key = string | number;
type ComponentFn = (props: Props) => VNode;

// 内部で扱う正規化済み props
interface Props { [name: string]: unknown; children: VNode[] }
// JSX でコンポーネントを書くときの props（子 1 個も許すため型を分ける。理由は §7）
interface ComponentProps { [name: string]: unknown; children?: VNode | VNode[] }

type VNode = TextVNode | ElementVNode;

interface TextVNode  { kind: 'text';    text: string; key: null }
interface ElementVNode {
  kind: 'element';
  type: string | ComponentFn;   // 'div' などのタグ名、または関数コンポーネント
  props: Props;                 // children を含む（React 準拠）
  key: Key | null;
}
```

- 文字列・数値の子は `TextVNode` に正規化する。`null` / `undefined` / `boolean` は捨てる
- `key` は props から抜き出して VNode 直下に持つ（React と同じ扱い）

### Instance — 「今こう描かれている」という実体（描画のたびに更新される・可変）

```ts
type Instance = TextInstance | HostInstance | ComponentInstance;

interface TextInstance      { kind: 'text';      vnode: TextVNode;    dom: Text }
interface HostInstance      { kind: 'host';      vnode: ElementVNode; dom: HTMLElement; children: Instance[] }
interface ComponentInstance { kind: 'component'; vnode: ElementVNode;
                              hooks: Hook[]; hookIndex: number;
                              child: Instance | null;   // mount 完了までは null
                              container: HTMLElement }
```

- **VNode と Instance を分ける理由**: 実DOMと hooks の状態は「描画をまたいで生き残る」必要がある。
  VNode は毎回捨てられるので、状態の置き場所は Instance 側にしかない。
  この分離が理解できれば「useState はどこに値を保存しているのか」が解ける
- `ComponentInstance` は自身の DOM を持たない。DOM が必要な場面では `getDom(instance)` で
  子をたどって取得する

### 簡略化のための制約（意図的な非対応）

- **関数コンポーネントは単一の要素を返すこと**。配列や Fragment を返した場合は例外を投げる。
  複数ルートを許すと「親DOMのどの位置に挿入するか」の計算が入り、主題から外れるため
- `Fragment` は `createElement` の段階で子リストに平坦展開する。ツリーには残さない。
  ただし TS が `<>...</>` の型を検査する都合上、`Fragment` は**関数として**定義する
  （呼ばれることはなく、呼ばれたら例外を投げる）
- Fragment に `key` を付けたリストは非対応

## 3. モジュール構成と責務

```
src/tiny-react/
├── types.ts          VNode / Instance / Hook の型定義（Claude が用意 = 仕様）
├── create-element.ts createElement, Fragment
├── dom.ts            props ⇔ 実DOM の適用のみ。VNode の差分は知らない
├── reconciler.ts     mount / diff / patch / unmount。DOM API を直接叩かず dom.ts を呼ぶ
├── hooks.ts          useState / useEffect と「レンダリング中コンテキスト」
├── scheduler.ts      再描画のバッチング
└── index.ts          公開 API。demo からはここだけを import する
```

### 主要シグネチャ

```ts
// create-element.ts
function createElement(type: string | ComponentFn, props: object | null, ...children: unknown[]): ElementVNode
const Fragment: unique symbol

// dom.ts
function createDom(vnode: ElementVNode): HTMLElement
function updateDomProps(dom: HTMLElement, prev: Props, next: Props): void

// reconciler.ts
function mount(vnode: VNode, container: HTMLElement): Instance
function patch(instance: Instance, nextVNode: VNode, container: HTMLElement): Instance
function unmount(instance: Instance): void
function getDom(instance: Instance): HTMLElement | Text
function rerender(instance: ComponentInstance): void   // hooks/scheduler から呼ばれる

// hooks.ts
function useState<S>(initial: S | (() => S)): [S, (next: S | ((prev: S) => S)) => void]
function useEffect(effect: () => (void | (() => void)), deps?: unknown[]): void

// index.ts
function render(vnode: VNode, container: HTMLElement): void
```

### hooks と reconciler の結合点

hooks は「今どの ComponentInstance をレンダリング中か」だけを reconciler と共有する。

```ts
// hooks.ts が持つモジュールスコープの状態
let currentInstance: ComponentInstance | null;  // reconciler が set/clear する
```

reconciler がコンポーネント関数を呼ぶ直前に `currentInstance` をセットし、直後にクリアする。
`useState` は `currentInstance.hooks[currentInstance.hookIndex++]` を読む。
**この 1 点の結合が「Hook が呼び出し順に依存する」理由そのもの**なので、隠さず明示的に置く。

`currentInstance` が null のまま Hook が呼ばれたら例外を投げる（＝コンポーネント外での Hook 呼び出し）。

## 4. 描画フロー

### 初回 `render(vnode, container)`
1. `mount(vnode, container)` で Instance ツリーを構築しながら実DOMを組み立てる
2. ルート Instance を `WeakMap<HTMLElement, Instance>` に保存し、次回描画で参照する
3. commit（DOM 反映）後に、溜まった effect を実行する

### 再描画（`setState` 起点）
1. `setState` が値を書き換え、`scheduleRerender(instance)` を呼ぶ
2. scheduler が対象 Instance を Set に積み、`queueMicrotask` で 1 回だけ flush（Step 8）
3. flush で `rerender(instance)` → コンポーネント関数を再実行 → `patch` で差分だけ DOM に当てる
4. patch 完了後に effect（cleanup → 実行）を走らせる

Step 6 の時点では同期的に再描画してよい。Step 8 でこのバッチング層を差し込む。

### patch の判断ルール
| 条件 | 動作 |
|------|------|
| kind が違う | 作り直し（unmount → mount） |
| kind: text で text が同じ | 何もしない |
| kind: text で text が違う | `dom.nodeValue` を書き換え（ノードは再利用） |
| type が違う | 作り直し |
| type が同じ host | DOM を再利用し、props 差分のみ適用 → 子を再帰 patch |
| type が同じ component | Instance を再利用（＝ hooks が保持される）→ 関数を再実行して子を patch |

### 子リストの差分（Step 4 → 5）
- Step 4: インデックス対応のみ。数が減ったら余りを unmount、増えたら mount
- Step 5: `key` があるものは key で対応付ける。並べ替えでも DOM ノードを再利用し、
  必要な分だけ `insertBefore` で移動させる

## 5. エラーハンドリング

学習用途のため、握りつぶさず**早期に例外を投げる**。

- コンポーネント外での Hook 呼び出し
- 描画間で Hook の呼び出し個数が変わった（＝条件分岐内での Hook 呼び出し）
- 関数コンポーネントが要素以外（配列・null）を返した
- `render` の container が要素でない

いずれもメッセージに「なぜ駄目か」を書く。React 本体が同種のガードを持つ理由の追体験になる。

## 6. テスト戦略

- ランナー: Vitest / 環境: happy-dom
- ファイル: `tests/NN-<topic>.test.tsx`。**ユーザーは編集しない**（仕様書として扱う）
- Step 1 のテストのみ `createElement` を直接呼ぶ。Step 2 以降は JSX で記述する
  （Step 1 が未完だと JSX が動かないため）

判定の作り方:
- **DOM ノードの再利用は参照の同一性（`===`）で検証する**。`innerHTML` の一致だけでは
  毎回作り直す実装も通ってしまい、差分更新を実装した意味がなくなる
- `useEffect` の実行順序・cleanup はログ配列への push で検証する
- バッチングは「描画回数のカウンタ」で検証する（`setState` 3 回で再描画 1 回）
- 例外系は `expect(...).toThrow()` で検証する

## 7. ビルド構成（Step 0 で Claude が用意）

```
package.json   scripts: dev / build / test / test:watch / typecheck
vite.config.ts oxc: { jsx: { runtime: 'classic', pragma: 'createElement', pragmaFrag: 'Fragment' } }
               test: { environment: 'happy-dom', globals: true }
tsconfig.json  strict, jsx: 'react', jsxFactory: 'createElement', jsxFragmentFactory: 'Fragment'
index.html     demo のエントリ
```

構築時に実機で確認して判明した点（推測ではなく検証済み）:

- **Vite 8 のトランスフォーマは esbuild ではなく oxc**。`esbuild.jsxFactory` を書いても
  「oxc options will be used」と警告が出て無視される。`oxc.jsx` に書く必要がある
- **`JSX.ElementChildrenAttribute` を宣言しなくても TS は children を型検査する**。
  そのため props 型を 2 つに分けた。コンポーネントの引数が `children: VNode[]` だと
  `<Box>子ひとつ</Box>` が「配列ではない」と弾かれるため、JSX 側は `ComponentProps` を使う
- `Fragment` の props 型に index signature があると `<></>` が
  「Index signature is missing in type '{}'」で弾かれる。
  よって `Fragment` の引数型は `{ children?: VNode | VNode[] }` とする

`jsxInject` による自動 import は**使わない**。各ファイルで
`import { createElement, Fragment } from '../tiny-react'` を明示的に書かせることで、
「JSX は createElement 呼び出しに変換されている」ことを常に目に見える形にする。

## 8. ステップごとの成果物

| # | 実装対象 | テスト | 主な検証内容 |
|---|----------|--------|--------------|
| 0 | （Claude）環境一式 + types.ts | 疎通のみ | `npm test` が動く |
| 1 | create-element.ts | 01 | children 平坦化 / テキスト正規化 / null 除去 / key 抽出 |
| 2 | dom.ts, reconciler.ts (mount) | 02 | 属性・イベント・style の反映、ネスト構造 |
| 3 | reconciler.ts (component) | 03 | 関数呼び出しと props 受け渡し、入れ子コンポーネント |
| 4 | reconciler.ts (patch) | 04 | DOM 再利用（参照同一性）、props 差分、型変化での作り直し |
| 5 | reconciler.ts (keyed children) | 05 | 並べ替え・挿入・削除でノードが保持されること |
| 6 | hooks.ts (useState) | 06 | 状態保持、複数 Hook、呼び出し順違反での例外 |
| 7 | hooks.ts (useEffect) | 07 | deps 比較、cleanup、DOM 反映後に実行される順序 |
| 8 | scheduler.ts | 08 | setState 複数回で再描画 1 回 |
| 9 | src/demo/ | 手動 | カウンター・TODO が動作 |
