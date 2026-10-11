# Step 2: 初回描画（mount）

## ゴール

Step 1 で作った VNode（設計図）から、実DOM を組み立てて画面に出す。

```
<div id="a" class="x">hi</div>
        ↓ Step 1 で作った VNode
{ kind: 'element', type: 'div', props: { id: 'a', className: 'x', children: [text('hi')] } }
        ↓ あなたが実装する部分（mount）
<div id="a" class="x">hi</div>   ← 実DOM が container の中に入る
        + Instance ツリー          ← 「今こう描かれている」という記録
```

**VNode は使い捨ての設計図、Instance は残る実体**。mount は「VNode を読んで実DOM を作る」と同時に
「作った DOM への参照を Instance として持ち帰る」。この Instance が、Step 4 以降の差分更新の足場になる。
`src/tiny-react/types.ts` の `TextInstance` / `HostInstance` を読んでから始めてください。

## 触るファイル

- `src/tiny-react/dom.ts` ← props ⇔ 実DOM（`createDom`, `updateDomProps`）
- `src/tiny-react/reconciler.ts` ← `mount`
- `src/tiny-react/index.ts` ← `render`

`types.ts` は読むだけ。**役割分担**: dom.ts は DOM と props のことだけを知り、
reconciler.ts は VNode ツリーを歩くことだけに専念して DOM API を直接叩かない（設計書 §3）。

## 作るもの

```ts
// dom.ts
function createDom(vnode: ElementVNode): HTMLElement          // 要素を作り props を反映（子は扱わない）
function updateDomProps(dom: HTMLElement, prev: Props, next: Props): void

// reconciler.ts
function mount(vnode: VNode, container: HTMLElement): Instance  // container の末尾に挿入する

// index.ts
function render(vnode: VNode, container: HTMLElement): void
```

## 仕様

正確な仕様は `tests/02-mount.test.tsx` にある。要約すると:

**構造**
- `type` が文字列の要素は、その名前のタグになる。子は順番どおりに入る（入れ子も）
- 文字列・数値の子は Text ノードになる。**`<` などは文字列として扱い、HTML として解釈しない**
- `mount` は container の**末尾に**入れ、Instance を返す
  - text → `{ kind: 'text', vnode, dom: Text }`
  - 要素 → `{ kind: 'host', vnode, dom: HTMLElement, children: Instance[] }`
- 関数コンポーネントは Step 3。今は例外を投げてよい（テストなし）

**props**
- 普通の props は属性になる（`id="a"`、数値は文字列化）
- `className` は `class` 属性になる
- `true` は空の属性（`disabled=""`）、`false` / `null` / `undefined` は属性を付けない
- `children` と `key` は属性にしない（VNode の構造を表すもので、DOM の属性ではない）
- `on` で始まる props はイベントリスナー。`onClick` → `click`、`onMouseDown` → `mousedown`
  （`on` を除いて小文字にしたものがイベント名）。**属性（`onclick="..."`）にはしない**
- `style` はオブジェクトで渡される（`{ color: 'red', fontSize: '12px' }`）。キーは camelCase

**render**
- container の中に描画する
- container が要素でなければ、理由を書いた例外を投げる（設計書 §5）。メッセージには `container` という語を含める

## 確認

```
npx vitest run tests/02-mount.test.tsx   # このステップだけ
npm test                                  # 全部
npm run typecheck
```

## 考えてほしいこと

1. なぜ `innerHTML` で組み立てず、`createElement` と `appendChild` で作るのか。
   テストの「`<b>` が文字列として出る」ケースは、何を防いでいるか
2. `on*` を `setAttribute` ではなく `addEventListener` にするのはなぜか。
   Step 4 で「ハンドラが変わった」ときに、何が困るか
3. `HostInstance` が `vnode` を保持しているのは、何のためか（Step 4 で効く）

## 詰まったら

- **「ヒント」** … 3 段階で出します
- **「答え」** … 実装例を出します
- テストの方がおかしいと思ったら、遠慮なく指摘してください
