# Step 4: 差分更新（patch）

## ゴール

2 回目以降の描画で、**前回作った DOM を使い回して、変わった部分だけを更新する**。

```
render(<div id="a">x</div>, container)    ← 1 回目: mount（DOM を作る）
render(<div id="b">y</div>, container)    ← 2 回目: patch（同じ <div> のまま id と中身だけ書き換える）
```

毎回作り直せば結果の見た目は同じになる。それでも差分更新をする理由は、
DOM ノードの**状態を壊さない**ため（入力中のテキスト、フォーカス、スクロール位置など）と、
無駄な DOM 操作を減らすため。このステップのテストは、**DOM ノードの参照が同じこと（`toBe`）**で
「本当に使い回したか」を確かめる。

このステップは全体の山場。Step 1〜3 のテストも回し続けて、壊していないことを確認する。

## 触るファイル

- `src/tiny-react/reconciler.ts` ← `patch`, `unmount`, `getDom`
- `src/tiny-react/dom.ts` ← `updateDomProps` を「差分」に対応させる
- `src/tiny-react/index.ts` ← `render` を 2 回目以降は patch にする

## 作るもの

```ts
// reconciler.ts
function patch(instance: Instance, nextVNode: VNode, container: HTMLElement): Instance
function unmount(instance: Instance): void
function getDom(instance: Instance): HTMLElement | Text

// dom.ts（既存の関数を広げる）
function updateDomProps(dom: HTMLElement, prev: Props, next: Props): void
```

## 仕様

正確な仕様は `tests/04-patch.test.tsx` にある。要約すると:

### patch の判断ルール（設計書 §4 と同じ）

| 条件 | 動作 |
|------|------|
| text どうし | 中身が違えば `nodeValue` だけ書き換える。Text ノードは再利用 |
| 同じ type の host | DOM を再利用し、props の差分だけ当て、子を patch する |
| 同じ関数の component | Instance を再利用し（hooks が保持される）、関数を新しい props で再実行して、`child` を patch する |
| それ以外（kind や type が違う） | 作り直す（新しく mount して、古いものは unmount） |

- 再利用できるときは、**同じ Instance オブジェクトを返す**（`vnode` を新しいものに更新する）
- 作り直したときは、**新しい Instance を返す**
- コンポーネントの再実行でも、`mount` と同じ検査をする（不正な戻り値は例外）

### 子の差分（インデックス対応のみ）

- 同じ位置どうしを patch する
- 子が増えたら、増えた分だけ末尾に mount する
- 子が減ったら、余った分を unmount する
- 並べ替えや先頭への挿入は、今は扱わない（Step 5 の key で解く）

### 作り直したときの位置

作り直した DOM は、**元の DOM があった位置**に入る。`mount` は container の末尾に入れるので、
そのままでは「ルートの前後に別の要素があるとき」「子の途中のとき」に順序が崩れる。
テストの「元の位置に入る」の 3 件が、これを見ている。

### updateDomProps（prev と next の比較）

- 追加・変更・削除の 3 つに対応する
- イベントは、**前のハンドラを外してから**新しいものを付ける（前のハンドラは `prev` の中にある）
- `style` は、前にあって今回無いキーを外す
- `className` は削除すると `class` 属性が消える。`true` → `false` で属性が外れる

### unmount / getDom

- `unmount`: その Instance が作った DOM を、親から取り除く
- `getDom`: text / host は自分の `dom`、component は `child` の DOM をたどって返す

### render

- 同じ container への 2 回目以降の `render` は、前回のルートの Instance と patch する
- 前回のルートの Instance は、container ごとに覚えておく（`WeakMap<HTMLElement, Instance>`）
- container に元からあった他の内容は、そのまま残る

## つまずきポイント

- **Step 2 のテストが落ちる**: `updateDomProps` を差分にすると、`createDom` が
  `updateDomProps(dom, vnode.props, vnode.props)` と、prev と next に同じ props を渡している部分が
  効いてきて、何も反映されなくなる。初回は「何も付いていない状態」からの差分のはず
- **位置を保つ方法**: DOM に挿入する API は `appendChild` だけではない
- **子の減らし方**: 配列を前から順に消しながら添字を使うと、ずれる
- **component の `container`**: 再実行した結果を patch するとき、どの要素が親なのかを考える

## 確認

```
npx vitest run tests/04-patch.test.tsx   # このステップだけ
npm test                                  # 全部（Step 1〜3 も緑のままであること）
npm run typecheck
```

## 考えてほしいこと

1. 「作り直し」をなくして、毎回 `container.innerHTML = ''` から作り直すのと比べて、何が失われるか
2. 同じ Instance を「書き換えて」返すのと、毎回新しい Instance を作るのとでは、何が違うか。
   Step 6（useState）で、どちらが必要になるか
3. 子をインデックスで対応させると、どんなリストで困るか（Step 5 の予告）

## 詰まったら

- **「ヒント」** … 3 段階で出します
- **「答え」** … 実装例を出します
- 量が多いので、**一度に全部やらず、テストを 1 つずつ緑にしていく**のがおすすめです
  （`getDom` → `unmount` → text の patch → host の props → 子の増減 → 作り直し → component → render）
