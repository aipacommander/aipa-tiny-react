/**
 * tiny-react の中心となるデータ構造。
 *
 * ここに出てくる 2 つのツリーの違いが、このプロジェクト全体の要になる。
 *
 *   VNode    … 「今回こう描きたい」という設計図。描画のたびに作り直され、使い捨てられる。
 *   Instance … 「今こう描かれている」という実体。描画をまたいで生き残る。
 *
 * 実DOM と Hook の状態は描画をまたいで保持する必要があるので、置き場所は Instance 側しかない。
 * 「useState の値はどこに保存されているのか」の答えもここにある。
 */

// ---------------------------------------------------------------------------
// VNode（設計図）
// ---------------------------------------------------------------------------

export type Key = string | number;

/** 関数コンポーネント。単一の要素を返すこと（配列や null は非対応）。 */
export type ComponentFn = (props: Props) => VNode;

/**
 * 正規化済みの props。tiny-react の内部ではこちらを扱う。
 * createElement を通った後の children は必ず VNode の配列になっている。
 */
export interface Props {
  [name: string]: unknown;
  children: VNode[];
}

/**
 * JSX でコンポーネントを書くときに使う props の型。
 *
 * JSX 上の子は「1 個なら単体、複数なら配列」として型付けされるので、両方を許している。
 * 実行時は createElement が必ず VNode[] に正規化するため、内部では Props だけを見ればよい。
 */
export interface ComponentProps {
  [name: string]: unknown;
  children?: VNode | VNode[];
}

/**
 * 文字列・数値の子はこの形に正規化する。
 * JSX の {"hi"} や {42} が、そのままではなく TextVNode になる。
 */
export interface TextVNode {
  kind: 'text';
  text: string;
  key: null;
}

/**
 * ホスト要素（'div' などのタグ名）と関数コンポーネントの両方を表す。
 * どちらも「type と props を持つ」という点では同じなので、型で分けない。
 */
export interface ElementVNode {
  kind: 'element';
  type: string | ComponentFn;
  props: Props;
  /** リスト差分（Step 5）で使う。props からは取り除いて、ここに持つ。 */
  key: Key | null;
}

export type VNode = TextVNode | ElementVNode;

// ---------------------------------------------------------------------------
// Instance（実体）
// ---------------------------------------------------------------------------

export interface TextInstance {
  kind: 'text';
  vnode: TextVNode;
  dom: Text;
}

export interface HostInstance {
  kind: 'host';
  vnode: ElementVNode;
  dom: HTMLElement;
  children: Instance[];
}

/**
 * 関数コンポーネントの実体。
 *
 * 自分自身の DOM は持たない（コンポーネントは DOM に現れない）。
 * DOM が必要なときは child をたどって取得する。
 */
export interface ComponentInstance {
  kind: 'component';
  vnode: ElementVNode;
  /** Hook の状態。呼ばれた順に並ぶ。これが「Hook が順序に依存する」正体。 */
  hooks: Hook[];
  /** レンダリング中に「今何番目の Hook か」を数えるカウンタ。描画のたびに 0 に戻す。 */
  hookIndex: number;
  /** コンポーネントが返した要素の実体。mount 完了までは null。 */
  child: Instance | null;
  /** 再描画のときに patch 先として必要になる、この実体が属する親要素。 */
  container: HTMLElement;
}

export type Instance = TextInstance | HostInstance | ComponentInstance;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface StateHook {
  kind: 'state';
  value: unknown;
}

export interface EffectHook {
  kind: 'effect';
  /** 前回の deps。deps を渡さなかった場合は null（＝毎回実行）。 */
  deps: unknown[] | null;
  /** 前回の effect が返した後始末関数。無ければ undefined。 */
  cleanup: (() => void) | undefined;
}

export type Hook = StateHook | EffectHook;

// ---------------------------------------------------------------------------
// JSX の型付け
// ---------------------------------------------------------------------------

declare global {
  namespace JSX {
    /** JSX 式の型。<div /> と書いたときの値は ElementVNode になる。 */
    type Element = ElementVNode;

    /**
     * 学習用途なのでタグ名と属性の検査はしない（本物の React は全タグを列挙している）。
     * 子の型検査は TS が既定で children プロパティに対して行う。コンポーネントを書くときに
     * Props ではなく ComponentProps を使うのはこのため（Props だと子 1 個が弾かれる）。
     */
    interface IntrinsicElements {
      [tagName: string]: Record<string, unknown>;
    }
  }
}
