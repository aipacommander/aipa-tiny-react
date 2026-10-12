/**
 * tiny-react の公開 API。
 * デモやテストからは、内部ファイルではなくここだけを import する。
 */
import { mount } from './reconciler';
import type { Instance, VNode } from './types';

export { createElement, Fragment } from './create-element';
export { getDom, mount, patch, unmount } from './reconciler';
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
 * 初回は mount、同じ container への 2 回目以降は、前回のルートの Instance と patch する（Step 4）。
 * 前回のルートの Instance は、container ごとに覚えておく必要がある（設計書 §4）。
 *
 * container が要素でなければ、理由を書いた例外を投げる。
 */
export function render(vnode: VNode, container: HTMLElement): Instance {
  if (!(container instanceof HTMLElement)) {
    throw new Error('container は HTMLElement でなければなりません');
  }
  return mount(vnode, container);
}
