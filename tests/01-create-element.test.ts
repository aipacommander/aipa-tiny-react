import { createElement, Fragment } from '../src/tiny-react';
import type { ElementVNode, TextVNode } from '../src/tiny-react';

/**
 * Step 1 の仕様。このファイルは編集しないこと。
 *
 * このステップのテストだけは JSX を使わず createElement を直接呼ぶ。
 * createElement が未完成だと JSX 自体が動かないため。
 */

const text = (t: string): TextVNode => ({ kind: 'text', text: t, key: null });

describe('Step 1: createElement', () => {
  describe('基本の形', () => {
    it('type / props / children を持つ VNode を返す', () => {
      expect(createElement('div', { id: 'a' }, 'hi')).toEqual({
        kind: 'element',
        type: 'div',
        key: null,
        props: { id: 'a', children: [text('hi')] },
      });
    });

    it('props が null でも children だけを持つ props になる', () => {
      expect(createElement('br', null)).toEqual({
        kind: 'element',
        type: 'br',
        key: null,
        props: { children: [] },
      });
    });

    it('関数コンポーネントも type にそのまま入る', () => {
      const Box = (): ElementVNode => createElement('div', null);
      const vnode = createElement(Box, { size: 3 });

      expect(vnode.type).toBe(Box);
      expect(vnode.props.size).toBe(3);
    });

    it('渡された props オブジェクトを書き換えない', () => {
      const props = { id: 'a' };
      createElement('div', props, 'hi');

      expect(props).toEqual({ id: 'a' });
    });
  });

  describe('children の正規化', () => {
    it('文字列と数値はテキストノードになる', () => {
      const vnode = createElement('p', null, 'hi', 42);

      expect(vnode.props.children).toEqual([text('hi'), text('42')]);
    });

    it('数値の 0 と空文字は捨てずに残す', () => {
      const vnode = createElement('p', null, 0, '');

      expect(vnode.props.children).toEqual([text('0'), text('')]);
    });

    it('null / undefined / true / false は取り除く', () => {
      const vnode = createElement('p', null, null, undefined, true, false, 'x');

      expect(vnode.props.children).toEqual([text('x')]);
    });

    it('配列で渡された子は平坦にする', () => {
      const a = createElement('a', null);
      const b = createElement('b', null);
      const vnode = createElement('ul', null, [a, b], createElement('c', null));

      expect(vnode.props.children).toHaveLength(3);
      expect(vnode.props.children[0]).toBe(a);
      expect(vnode.props.children[1]).toBe(b);
    });

    it('入れ子の配列も平坦にする', () => {
      const vnode = createElement('ul', null, [['x'], ['y', ['z']]]);

      expect(vnode.props.children).toEqual([text('x'), text('y'), text('z')]);
    });

    it('可変長引数の children は props.children より優先される', () => {
      const vnode = createElement('p', { children: ['ignored'] }, 'used');

      expect(vnode.props.children).toEqual([text('used')]);
    });

    it('子が無ければ空配列になる（undefined にしない）', () => {
      expect(createElement('br', null).props.children).toEqual([]);
    });
  });

  describe('key', () => {
    it('key は props から取り出して VNode 直下に持つ', () => {
      const vnode = createElement('li', { key: 'k1', id: 'a' });

      expect(vnode.key).toBe('k1');
      expect(vnode.props).toEqual({ id: 'a', children: [] });
    });

    it('数値の key も使える', () => {
      expect(createElement('li', { key: 3 }).key).toBe(3);
    });

    it('key が無ければ null', () => {
      expect(createElement('li', null).key).toBe(null);
    });
  });

  describe('Fragment', () => {
    it('Fragment 自身は type に Fragment を持つ VNode になる', () => {
      const vnode = createElement(Fragment, null, 'x');

      expect(vnode.type).toBe(Fragment);
    });

    it('子に現れた Fragment は親の children に平坦展開される', () => {
      const a = createElement('a', null);
      const b = createElement('b', null);
      const c = createElement('c', null);
      const vnode = createElement('div', null, createElement(Fragment, null, a, b), c);

      expect(vnode.props.children).toEqual([a, b, c]);
    });

    it('入れ子の Fragment も展開される', () => {
      const a = createElement('a', null);
      const inner = createElement(Fragment, null, a);
      const outer = createElement(Fragment, null, inner, 'x');
      const vnode = createElement('div', null, outer);

      expect(vnode.props.children).toEqual([a, text('x')]);
    });

    it('Fragment をコンポーネントとして直接呼ぶと例外になる', () => {
      expect(() => Fragment({})).toThrow();
    });
  });
});
