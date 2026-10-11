import type { ElementVNode, Props } from './types';

/**
 * ElementVNode（type が文字列のもの）から実DOM要素を作り、props を反映して返す。
 *
 * 子は扱わない。子の生成と挿入は reconciler の仕事。
 * このファイルは「props ⇔ 実DOM」だけを知っていて、VNode ツリーの差分は知らない。
 *
 * 仕様は docs/steps/02-mount.md と tests/02-mount.test.tsx を参照。
 */
export function createDom(vnode: ElementVNode): HTMLElement {
  void vnode;
  throw new Error('not implemented: createDom');
}

/**
 * props を実DOMに反映する。
 *
 * Step 2 では「prev に無かったものを next から足す」だけでよい（初回描画しか無いため）。
 * ただし引数を prev / next の 2 つにしてあるのは、Step 4 で
 * 「変更・削除・イベントの張り替え」を同じ関数に足すため。
 */
export function updateDomProps(dom: HTMLElement, prev: Props, next: Props): void {
  void dom;
  void prev;
  void next;
  throw new Error('not implemented: updateDomProps');
}
