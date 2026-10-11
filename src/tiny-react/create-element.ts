import type { ComponentFn, ElementVNode, Key, Props, TextVNode, VNode } from './types';

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
  const text = (t: string): TextVNode => {
    return {
      kind: 'text',
      text: t,
      key: null,
    }
  };
  let childrenNodes: VNode[] = children
  .flat(Infinity)
  .filter(child => {
    if (child === null || child === undefined) {
      return false;
    }
    if (typeof child === 'boolean') {
      return false;
    }
    return true;
  })
  .flatMap((child): unknown[] => {
    const node = child as VNode;
    if (node.kind === 'element' && node.type === Fragment) {
      return node.props.children;
    }
    return [child];
  })
  .map(child => {
    if (typeof child === 'string') {
      return text(child);
    }
    if (typeof child === 'number') {
      return text(child.toString());
    }
    return child as VNode;
  });

  const { key, ...rest } = (props ?? {}) as Record<string, unknown>;
  const gotKey: Key | null = key === undefined || key === null ? null : key as Key;
  const getProps: Props | undefined = {
    ...rest,
    children: childrenNodes,
  }

  return {
    kind: 'element',
    type,
    key: gotKey,
    props: getProps,
  }
}
