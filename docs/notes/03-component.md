# Step 3 解説: 関数コンポーネント

## 完成した処理の流れ

```
mount(vnode, container)
  └ vnode.type が関数なら
      1. rVnode = vnode.type(vnode.props)     コンポーネントを 1 回呼ぶ
      2. rVnode が「Fragment ではない要素」か検査。違えば例外
      3. child = mount(rVnode, container)     ★ container をそのまま渡す（新しい親 DOM は作らない）
      4. { kind: 'component', vnode, hooks: [], hookIndex: 0, child, container } を返す
```

## 学んだこと

### 1. コンポーネントは DOM を作らない
host は `createDom` で要素を作り、子には `dom` を渡した。component は何も作らず、
返ってきた VNode を、受け取った `container` にそのまま mount する。
だから `<Hello />` という DOM は存在せず、`ComponentInstance` は `dom` を持たない（`child` を持つ）。

### 2. 関数を書くのは使う側
`Greeting` のような関数は、アプリを書く人が定義する。mount は `vnode.type(vnode.props)` と呼ぶだけ。
`createElement` が関数をそのまま `type` に入れておいてくれるので、ここまで繋がる。

### 3. ガードは「通すものを 1 つに決める」
「null・文字列・配列を弾く」と列挙すると、数値・真偽値・素のオブジェクトなどが漏れる。
「`kind === 'element'` かつ Fragment ではない」だけを通せば、漏れがない。
null を `.kind` で読むと TypeError になるので、オブジェクトかどうかを先に確認する。

### 4. 起きた不具合から
- **`is〜` の関数が逆の値を返していた**: 「ダメなら true」を返したため、正常系が全部落ちた。
  名前どおりのとき true を返すように書くと、呼び出し側が読みやすい
- **Fragment のテストが偶然通っていた**: `Fragment` 関数が自分で例外を投げ、そのメッセージに
  たまたま「コンポーネント」が含まれていた。意図した検査で通っているかは、テストの結果だけでは分からない

## レビューで気づいた点（任意で直す）

- **エラーメッセージ**: 「null を返せません」は、文字列や配列を返したときにも出る。
  「コンポーネントは単一の要素を返す必要があります」のような一般的な文面のほうが正確
- **`isElementVNode` の引数が `VNode`**: 実際には null などが来るので、`unknown` が実態に合う。
  `value is ElementVNode` の型ガードにすると、呼び出し側の型も絞られる。
  `vnode !== undefined` は、`typeof undefined` が `'object'` ではないので不要
- **Step 6 に向けて**: 今は関数を呼んでから Instance を作っているが、useState は「呼び出し中の Instance」を
  必要とする。Step 6 では、先に `child: null` の Instance を作り、`currentInstance` に入れてから呼ぶ形に変わる
