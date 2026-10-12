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
  const dom = document.createElement(vnode.type as string);
  updateDomProps(dom, vnode.props, vnode.props);

  return dom;
}

/**
 * props を実DOMに反映する。
 *
 * Step 2 では「prev に無かったものを next から足す」だけでよい（初回描画しか無いため）。
 * ただし引数を prev / next の 2 つにしてあるのは、Step 4 で
 * 「変更・削除・イベントの張り替え」を同じ関数に足すため。
 */
export function updateDomProps(dom: HTMLElement, prev: Props, next: Props): void {
  for (const [name, value] of Object.entries(next)) {
    if (value === false || value === null || value === undefined) continue;
    if(name === 'children' || name === 'key') continue;
    if (/^on[A-Z]/.test(name)) {
      const eventName = name.slice(2).toLowerCase();
      dom.addEventListener(eventName, value as EventListener);
      continue;
    }
    if (name === 'className') {
      dom.setAttribute('class', String(value));
      continue;
    }
    if (name === 'style') {
      Object.assign(dom.style, value as Record<string, string>);
      continue;
    }
    if (value === true) {
      dom.setAttribute(name, '');
      continue;
    }
    dom.setAttribute(name, String(value));
  }
}
