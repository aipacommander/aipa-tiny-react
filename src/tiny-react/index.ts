/**
 * tiny-react の公開 API。
 * デモやテストからは、内部ファイルではなくここだけを import する。
 */
import { mount } from './reconciler';
import type { Instance, VNode } from './types';

export { createElement, Fragment } from './create-element';
export { mount } from './reconciler';
export type {
  ComponentFn,
  ComponentProps,
  ElementVNode,
  Instance,
  Key,
  Props,
  TextVNode,
  VNode,
} from './types';

/**
 * vnode を container に描画する。
 *
 * Step 2 では「空の container に初めて描画する」場合だけを扱う。
 * 2 回目以降の描画（差分更新）は Step 4 で足す。
 *
 * container が要素でなければ、理由を書いた例外を投げる。
 */
export function render(vnode: VNode, container: HTMLElement): Instance {
  if (!(container instanceof HTMLElement)) {
    throw new Error('container は HTMLElement でなければなりません');
  }
  return mount(vnode, container);
}
