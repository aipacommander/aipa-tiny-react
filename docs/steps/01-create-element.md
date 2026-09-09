# Step 1: createElement と VNode

## ゴール

JSX 1 つ分を、扱いやすい形のデータ（VNode）に変換する関数を作る。

```
<div id="a">hi</div>
        ↓ oxc が変換
createElement('div', { id: 'a' }, 'hi')
        ↓ あなたが実装する部分
{ kind: 'element', type: 'div', key: null,
  props: { id: 'a', children: [{ kind: 'text', text: 'hi', key: null }] } }
```

ここから先の全ステップは、この関数が返す形の上に積み上がる。
つまり **Step 1 は「以降の全部が乗る土台の形」を決める作業**にあたる。

## 触るファイル

- `src/tiny-react/create-element.ts` ← ここだけ
- `src/tiny-react/types.ts` は読む（書き換えない）。VNode の形が定義してある

## 作るもの

```ts
export function createElement(
  type: string | ComponentFn,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): ElementVNode
```

## 仕様

正確な仕様は `tests/01-create-element.test.ts` にある。要約すると:

**基本**
- 返すのは `ElementVNode`。`kind` は常に `'element'`
- `props` が `null` でも動く。その場合 props は `{ children: [] }` になる
- 渡された props オブジェクトを書き換えてはいけない（呼び出し側のものなので）

**children の正規化**
- 文字列・数値は `TextVNode`（`{ kind: 'text', text, key: null }`）にする
- ただし `0` と `''` は捨てない。`null` / `undefined` / `true` / `false` は捨てる
- 配列で渡されたら平坦にする。入れ子の配列も平坦にする
- 子が無ければ `undefined` ではなく空配列にする
- 可変長引数の children は `props.children` より優先する

**key**
- `props.key` は取り出して VNode 直下の `key` に置く。**props には残さない**
- key が無ければ `null`

**Fragment**
- `createElement(Fragment, null, ...)` は `type` に `Fragment` を持つ VNode を返す
- **子の位置に現れた Fragment は、親の children に平坦展開する**（ツリーに残さない）
- 入れ子の Fragment も展開する

## 確認

```
npx vitest run tests/01-create-element.test.ts   # このステップだけ
npm test                                          # 全部
npm run typecheck
```

18 個すべて緑になったら完了。

## 考えてほしいこと

実装しながら、次の問いを頭の片隅に置いておいてください。

1. なぜ `0` と `''` は残して、`false` は捨てるのか。
   JSX で `{count && <div/>}` と書いたとき、count が 0 だと何が起きるか
2. なぜ `key` を props から取り出して別の場所に持つのか。
   props に入れたままだと、後のステップで何が困るか
3. Fragment を「ツリーに残さず展開する」ことで、何が単純になったか。
   逆に、これで諦めた機能は何か

答えは Step 5・Step 2 あたりで実感できます。今は分からなくて構いません。

## 詰まったら

- **「ヒント」** … 3 段階（考える方向 → アルゴリズム → 擬似コード）で出します
- **「答え」** … 実装例を出します
- テストの方がおかしいと思ったら、遠慮なく指摘してください
