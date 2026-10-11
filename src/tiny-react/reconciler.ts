import type { Instance, VNode } from './types';

/**
 * VNode から Instance ツリーを作りながら、実DOMを組み立てて container の末尾に入れる。
 *
 *   text    -> Text ノードを作る             -> TextInstance
 *   host    -> 要素を作り、子を再帰的に mount -> HostInstance（children に子の Instance）
 *
 * 関数コンポーネント（type が関数）は Step 3 で扱う。今は例外を投げてよい。
 * DOM API を直接叩く部分は dom.ts に任せる。
 *
 * 仕様は docs/steps/02-mount.md と tests/02-mount.test.tsx を参照。
 */
export function mount(vnode: VNode, container: HTMLElement): Instance {
  void vnode;
  void container;
  throw new Error('not implemented: mount');
}
