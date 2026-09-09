import type { ComponentFn, ElementVNode, VNode } from './types';

/**
 * JSX の <>...</> が変換されると createElement(Fragment, null, ...children) になる。
 *
 * Fragment はツリーには残さず、createElement が親の children に平坦展開する。
 * つまりこの関数自体が呼ばれることはない。
 * （関数として定義しているのは、TypeScript が <>...</> の型を検査するときに
 *   呼び出しシグネチャを要求するため。）
 */
export function Fragment(_props: { children?: VNode | VNode[] }): never {
  throw new Error(
    'Fragment は createElement が展開するため、コンポーネントとして呼び出されることはありません',
  );
}

/**
 * JSX 1 つ分を VNode に変換する。
 *
 *   <div id="a">hi</div>  ->  createElement('div', { id: 'a' }, 'hi')
 *
 * 仕様は docs/steps/01-create-element.md と tests/01-create-element.test.ts を参照。
 */
export function createElement(
  type: string | ComponentFn,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): ElementVNode {
  void type;
  void props;
  void children;
  throw new Error('not implemented: createElement');
}
