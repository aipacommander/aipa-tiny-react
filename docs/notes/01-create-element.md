# Step 1 解説: createElement と VNode

## 完成した処理の流れ

```
children
  → flat(Infinity)      入れ子の配列を全部平らにする
  → filter              null / undefined / boolean を捨てる（0 と '' は残す）
  → flatMap             type === Fragment の要素を、その props.children に置き換える
  → map                 string / number を TextVNode にする
```

## 学んだこと

### 1. 順序が結果を決める
最初の実装は `map`（text 化）のあとに `flat()` を 1 回かけていた。
配列の中の文字列が text 化されず、入れ子も 1 段しか平らにならなかった。
**平坦化 → 除去 → 展開 → 変換**の順にすると、各段階が単純な 1 対 1 の処理で済む。

### 2. Fragment は「ツリーに残らない目印」
`<>...</>` は `createElement(Fragment, null, ...)` なので、`type === Fragment` の
`ElementVNode` として届く。親の `createElement` が、その要素を中身（`props.children`）に
置き換える。Fragment の children は、その `createElement` ですでに正規化済みなので、
入れ子の Fragment も再帰なしで展開できる。

### 3. 1 つを複数に置き換えるなら flatMap
`filter` は残す/捨てるだけ、`map` は 1 対 1。「1 つを 0 個以上に」は `flatMap`。

### 4. `unknown` と型の絞り込み
`children: unknown[]` の要素型は `unknown` のまま。`(child: VNode) => ...` を渡すと
TS2345 になる。文字列や数値も混ざる以上、`as VNode` でキャストして `kind` で絞る。
`flatMap` の戻り値に `: unknown[]` を付けると、後ろの `map` で `never` に絞られる問題を避けられる。

## レビューで気づいた点（任意で直す）

- `const gotKey = key ? key as Key : null` は、`key={0}` や `key=''` を `null` にしてしまう。
  `key === undefined || key === null` で判定するほうが正確。Step 5（key 差分）で効いてくる。
- `if (children.length > 0)` は不要。空配列でも同じ結果になる。
- `props as Record<string, unknown> ?? {}` は `(props ?? {})` のほうが読みやすい。
