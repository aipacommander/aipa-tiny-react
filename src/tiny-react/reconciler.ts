import { Fragment } from './create-element';
import { createDom } from './dom';
import type { Instance, VNode } from './types';

const isElementVNode = (vnode: VNode) => {
  const isVNode = typeof vnode === 'object' &&
    vnode !== null &&
    vnode !== undefined &&
    'kind' in vnode &&
    vnode.kind === 'element';
  
  return isVNode && vnode.type !== Fragment;
}

/**
 * VNode から Instance ツリーを作りながら、実DOMを組み立てて container の末尾に入れる。
 *
 *   text      -> Text ノードを作る              -> TextInstance
 *   host      -> 要素を作り、子を再帰的に mount  -> HostInstance（children に子の Instance）
 *   component -> 関数を呼び、返った VNode を mount -> ComponentInstance（child に結果の Instance）
 *
 * component（type が関数）は Step 3 で足す。今は例外を投げている。
 * DOM API を直接叩く部分は dom.ts に任せる。
 *
 * 仕様は docs/steps/02-mount.md, 03-component.md と tests/ 以下を参照。
 */
export function mount(vnode: VNode, container: HTMLElement): Instance {
  if (vnode.kind === 'text') {
    const dom = document.createTextNode(vnode.text);
    container.appendChild(dom);
    return {
      kind: 'text',
      vnode,
      dom,
    };
  }

  if (vnode.kind === 'element') {
    if (typeof vnode.type !== 'string') {
      // string 以外は、関数Componentとなる
      const rVnode = vnode.type(vnode.props);
      if (!isElementVNode(rVnode)) {
        throw new Error('コンポーネントは null を返せません');
      }
      const child = mount(rVnode, container);
      return {
        kind: 'component',
        vnode,
        hooks: [],
        hookIndex: 0,
        child,
        container,
      }
    }
    const dom = createDom(vnode);
    const children = vnode.props.children.map(child => mount(child, dom));
    container.appendChild(dom);
    return {
      kind: 'host',
      vnode,
      dom,
      children,
    }
  }

  throw new Error('未知の kind の VNode です');
}
