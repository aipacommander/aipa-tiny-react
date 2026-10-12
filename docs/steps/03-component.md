# Step 3: 関数コンポーネント

## ゴール

`<Hello name="a" />` のような、**自分で作った部品**を描画できるようにする。
Step 2 の `mount` は `type` が文字列（`'div'` など）の要素しか扱えなかった。
`type` が**関数**のときの分岐を足す。

```
<Greeting name="aipa" />
        ↓ Step 1: createElement
{ kind: 'element', type: Greeting, props: { name: 'aipa', children: [] } }
        ↓ あなたが実装する部分（mount の component 分岐）
Greeting({ name: 'aipa', children: [] })  を呼ぶ  →  <h1>Hello, aipa</h1> の VNode が返る
        ↓ それを mount する
<h1>Hello, aipa</h1>   ← DOM
        + ComponentInstance { child: HostInstance }
```

**コンポーネントは「DOM を作らない」**。関数を呼んで VNode を受け取り、それを mount するだけ。
だから `<Hello />` という DOM 要素は存在しない。

## 触るファイル

- `src/tiny-react/reconciler.ts` ← ここだけ（`mount` に分岐を足す）

`types.ts` の `ComponentInstance` を読んでから始めてください。

## 作るもの

シグネチャは変わらない。`mount` が、`vnode.type` が関数のときも扱えるようになる。

```ts
function mount(vnode: VNode, container: HTMLElement): Instance
//   type が関数 -> ComponentInstance を返す
```

## 仕様

正確な仕様は `tests/03-component.test.tsx` にある。要約すると:

**呼び出し**
- `vnode.type` の関数を、`vnode.props` を引数にして **1 回だけ**呼ぶ
- 関数が返した VNode を `mount` し、その Instance を `child` に持つ
- コンポーネントは**自分の DOM を持たない**。返された VNode は、`mount` に渡された
  `container` にそのまま入る（host のように、新しい親 DOM を作らない）

**ComponentInstance**
- `{ kind: 'component', vnode, hooks: [], hookIndex: 0, child, container }`
- `container` は、このコンポーネントの結果が入る親要素（Step 4 の再描画で使う）

**props / children**
- `props` は `createElement` が作ったもの（`key` は無し、`children` は必ず配列）
- `<Box><span/>b</Box>` の子は `props.children` で渡る。関数が `{children}` として
  そのまま返す要素の中に置けば、描画される

**入れ子**
- コンポーネントがコンポーネントを返してもよい（`child` が連なる）
- 要素の子にコンポーネントを置いてもよい

**不正な戻り値は例外**（設計書 §5）
- `null` / `undefined` / 文字列 / 配列 / `Fragment` を返したら例外
- メッセージには「コンポーネント」という語を含める

## 確認

```
npx vitest run tests/03-component.test.tsx   # このステップだけ
npm test                                      # 全部
npm run typecheck
```

## 考えてほしいこと

1. `ComponentInstance` を作るときに、`child` を最初は `null` にしておくのはなぜか。
   「関数を呼ぶ前に Instance がある」ことが、Step 6（useState）でなぜ必要になるか
2. 関数コンポーネントに `kind: 'host'` のような `dom` を持たせないのはなぜか。
   親が DOM を欲しいとき（Step 4）、どうやって取り出せばよいか
3. 配列や Fragment を返すのを禁止すると、何が単純になるか。
   逆に、React の本物ができて、この実装ができないことは何か

## 詰まったら

- **「ヒント」** … 3 段階で出します
- **「答え」** … 実装例を出します
- テストの方がおかしいと思ったら、遠慮なく指摘してください
