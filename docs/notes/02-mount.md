# Step 2 解説: 初回描画（mount）

## 完成した処理の流れ

```
render(vnode, container)        index.ts      container を検査して mount を呼ぶ
  └ mount(vnode, container)     reconciler.ts VNode ツリーを歩き、Instance ツリーを作る
      ├ text    -> createTextNode → container に入れる → TextInstance
      └ element -> createDom(vnode)           dom.ts: 要素を作り props を反映
                   → 子を mount(child, dom)   ★ container ではなく今作った dom を渡す
                   → container に入れる → HostInstance { vnode, dom, children }
```

`createDom` の中では `updateDomProps` が、props を 1 つずつ DOM に反映する。

## 学んだこと

### 1. 責務の分離
reconciler.ts は VNode ツリーを歩くだけで、props の意味（class・イベント・style）は
dom.ts だけが知っている。Step 4 で props の差分更新を足すときも、触るのは dom.ts だけで済む。

### 2. 再帰の container は「親の dom」
子を mount するとき、第 2 引数は呼び出し元の `container` ではなく、今作った `dom`。
これで子が親の中に入る。ツリーを歩く再帰と、DOM のツリーが 1 対 1 に対応する。

### 3. VNode と Instance を両方持つ理由
`HostInstance` は `vnode`（前回の設計図）と `dom`（実体）を持つ。
Step 4 では「前回の vnode」と「今回の vnode」を比べて、dom に差分だけを当てる。
その比較の左側が、Instance に持たせた `vnode` になる。

### 4. props の種類ごとの変換
JSX の props と HTML 属性は 1 対 1 ではない。
- `className` → `class`（`class` が JS の予約語なため）
- `on*` → `addEventListener`（属性にすると文字列の JS になってしまう）
- `style` → オブジェクトを `dom.style` に当てる
- `true` → 空の属性、`false`/`null`/`undefined` → 付けない
- `children` / `key` → DOM の属性ではない

### 5. 起きた不具合から
- **`__self` / `__source` が属性に混ざった**: JSX 変換の開発モードがデバッグ用の props を足していた。
  `oxc.jsx.development: false` で解決。props を全部属性にするようになって初めて表に出た
- **`dom.computedStyleMap` と `dom.style` の取り違え**: 実在する別のプロパティなので、
  型検査は通り、実行時にだけ落ちた。「型が通る ≠ 正しい」の例

## レビューで気づいた点（任意で直す）

- `createDom` が `updateDomProps(dom, vnode.props, vnode.props)` と、prev と next に同じ props を渡している。
  今は prev を使わないので動くが、Step 4 で「prev との差分」を取るようになると、何も反映されなくなる。
  「何も付いていない状態」として `{ children: [] }` を渡すのが意味に合う
- `name.startsWith('on')` は `one` や `only` のような、イベントではない props も拾ってしまう。
  `on` の次が大文字であること（`/^on[A-Z]/`）を条件にすると正確
- `render` が `Instance` を返している。課題文は `void`。Step 4 で `WeakMap` に保存する設計なので、
  外へ返す必要は今のところない
