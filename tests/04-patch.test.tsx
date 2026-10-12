import { createElement, getDom, mount, patch, render, unmount } from '../src/tiny-react';
import type { ComponentProps, Instance, TextVNode, VNode } from '../src/tiny-react';

/**
 * Step 4 の仕様。このファイルは編集しないこと。
 *
 * 差分更新の肝は「前回作った DOM を、できるだけ作り直さずに使い回す」こと。
 * innerHTML の一致だけでは、毎回作り直す実装も通ってしまう。
 * そのため、このファイルでは DOM ノードの**参照の同一性（toBe）**を何度も確かめている。
 */

let container: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = '';
  container = document.createElement('div');
  document.body.appendChild(container);
});

const text = (t: string): TextVNode => ({ kind: 'text', text: t, key: null });

const asHost = (i: Instance) => {
  if (i.kind !== 'host') throw new Error('host ではない');
  return i;
};
const asComponent = (i: Instance) => {
  if (i.kind !== 'component') throw new Error('component ではない');
  return i;
};

describe('Step 4: 差分更新', () => {
  describe('getDom', () => {
    it('text / host は自分の dom を返す', () => {
      const t = mount(text('a'), container);
      const h = mount(<p />, container);

      expect(getDom(t)).toBe(container.childNodes[0]);
      expect(getDom(h)).toBe(container.childNodes[1]);
    });

    it('component は、描画結果の dom を返す（入れ子でも）', () => {
      const Inner = () => <b />;
      const Outer = () => <Inner />;

      const instance = mount(<Outer />, container);

      expect(getDom(instance)).toBe(container.firstChild);
    });
  });

  describe('unmount', () => {
    it('host の DOM を取り除く。兄弟は残る', () => {
      const a = mount(<p>a</p>, container);
      mount(<p>b</p>, container);

      unmount(a);

      expect(container.innerHTML).toBe('<p>b</p>');
    });

    it('text の DOM を取り除く', () => {
      const t = mount(text('a'), container);

      unmount(t);

      expect(container.innerHTML).toBe('');
    });

    it('component が描画した DOM を取り除く', () => {
      const Hello = () => <p>hi</p>;
      const instance = mount(<Hello />, container);

      unmount(instance);

      expect(container.innerHTML).toBe('');
    });
  });

  describe('patch: DOM の再利用', () => {
    it('同じ type の要素は、DOM ノードを再利用し、同じ Instance を返す', () => {
      const instance = mount(<div id="a" />, container);
      const dom = container.firstChild;
      const next = (<div id="b" />) as VNode;

      const result = patch(instance, next, container);

      expect(result).toBe(instance);
      expect(container.firstChild).toBe(dom);
      expect(instance.vnode).toBe(next);
    });

    it('テキストが変わっても Text ノードは再利用され、中身だけ変わる', () => {
      const instance = mount(<p>a</p>, container);
      const p = container.firstChild!;
      const t = p.firstChild;

      patch(instance, <p>b</p>, container);

      expect(container.firstChild).toBe(p);
      expect(p.firstChild).toBe(t);
      expect(container.innerHTML).toBe('<p>b</p>');
    });

    it('text どうしの patch でも Text ノードを再利用する', () => {
      const instance = mount(text('a'), container);
      const t = container.firstChild!;

      const result = patch(instance, text('b'), container);

      expect(result).toBe(instance);
      expect(container.firstChild).toBe(t);
      expect(t.nodeValue).toBe('b');
    });

    it('入れ子の要素も再利用される', () => {
      const instance = mount(
        <div>
          <span>a</span>
        </div>,
        container,
      );
      const span = container.querySelector('span');

      patch(
        instance,
        <div>
          <span>b</span>
        </div>,
        container,
      );

      expect(container.querySelector('span')).toBe(span);
      expect(container.innerHTML).toBe('<div><span>b</span></div>');
    });
  });

  describe('patch: props', () => {
    it('追加・変更・削除ができる', () => {
      const instance = mount(<div id="a" title="t" />, container);
      const el = container.firstElementChild!;

      patch(instance, <div id="b" lang="ja" />, container);

      expect(el.getAttribute('id')).toBe('b');
      expect(el.getAttribute('lang')).toBe('ja');
      expect(el.hasAttribute('title')).toBe(false);
    });

    it('className の変更と削除', () => {
      const instance = mount(<div className="a" />, container);
      const el = container.firstElementChild!;

      patch(instance, <div className="b" />, container);
      expect(el.getAttribute('class')).toBe('b');

      patch(instance, <div />, container);
      expect(el.hasAttribute('class')).toBe(false);
    });

    it('true は属性を付け、false にすると外れる', () => {
      const instance = mount(<input disabled={true} />, container);
      const el = container.firstElementChild!;

      patch(instance, <input disabled={false} />, container);
      expect(el.hasAttribute('disabled')).toBe(false);

      patch(instance, <input disabled={true} />, container);
      expect(el.getAttribute('disabled')).toBe('');
    });

    it('イベントハンドラが変わったら張り替わる（古いほうは呼ばれない）', () => {
      const calls: string[] = [];
      const instance = mount(<button onClick={() => calls.push('first')} />, container);

      patch(instance, <button onClick={() => calls.push('second')} />, container);
      container.querySelector('button')!.click();

      expect(calls).toEqual(['second']);
    });

    it('イベントハンドラが無くなったら外れる', () => {
      const calls: string[] = [];
      const instance = mount(<button onClick={() => calls.push('x')} />, container);

      patch(instance, <button />, container);
      container.querySelector('button')!.click();

      expect(calls).toEqual([]);
    });

    it('style は変更・削除される', () => {
      const instance = mount(<div style={{ color: 'red', fontSize: '12px' }} />, container);
      const el = container.firstElementChild as HTMLElement;

      patch(instance, <div style={{ color: 'blue' }} />, container);
      expect(el.style.color).toBe('blue');
      expect(el.style.fontSize).toBe('');

      patch(instance, <div />, container);
      expect(el.style.color).toBe('');
    });
  });

  describe('patch: 子の増減（インデックス対応）', () => {
    it('子が増えたら、既存の子は再利用し、増えた分だけ追加する', () => {
      const instance = mount(
        <ul>
          <li>a</li>
        </ul>,
        container,
      );
      const li = container.querySelector('li');

      patch(
        instance,
        <ul>
          <li>a</li>
          <li>b</li>
        </ul>,
        container,
      );

      expect(container.querySelector('li')).toBe(li);
      expect(container.innerHTML).toBe('<ul><li>a</li><li>b</li></ul>');
      expect(asHost(instance).children).toHaveLength(2);
    });

    it('子が減ったら、余りが取り除かれる', () => {
      const instance = mount(
        <ul>
          <li>a</li>
          <li>b</li>
          <li>c</li>
        </ul>,
        container,
      );
      const first = container.querySelector('li');

      patch(
        instance,
        <ul>
          <li>a</li>
        </ul>,
        container,
      );

      expect(container.querySelector('li')).toBe(first);
      expect(container.innerHTML).toBe('<ul><li>a</li></ul>');
      expect(asHost(instance).children).toHaveLength(1);
    });

    it('子がすべて無くなる / 子が 0 から増える', () => {
      const instance = mount(
        <ul>
          <li>a</li>
        </ul>,
        container,
      );

      patch(instance, <ul />, container);
      expect(container.innerHTML).toBe('<ul></ul>');

      patch(
        instance,
        <ul>
          <li>b</li>
        </ul>,
        container,
      );
      expect(container.innerHTML).toBe('<ul><li>b</li></ul>');
    });
  });

  describe('patch: 作り直し', () => {
    it('type が変わったら作り直す（古い DOM は取り除かれる）', () => {
      const instance = mount(<div>x</div>, container);
      const old = container.firstChild!;

      const result = patch(instance, <p>x</p>, container);

      expect(result).not.toBe(instance);
      expect(container.firstChild).not.toBe(old);
      expect(old.isConnected).toBe(false);
      expect(container.innerHTML).toBe('<p>x</p>');
    });

    it('作り直しても、元の位置に入る（ルート）', () => {
      container.appendChild(document.createElement('hr'));
      const instance = mount(<div />, container);
      container.appendChild(document.createElement('br'));

      patch(instance, <p />, container);

      expect(container.innerHTML).toBe('<hr><p></p><br>');
    });

    it('作り直しても、元の位置に入る（子の途中）', () => {
      const instance = mount(
        <ul>
          <li>a</li>
          <p>b</p>
          <li>c</li>
        </ul>,
        container,
      );

      patch(
        instance,
        <ul>
          <li>a</li>
          <span>b</span>
          <li>c</li>
        </ul>,
        container,
      );

      expect(container.innerHTML).toBe('<ul><li>a</li><span>b</span><li>c</li></ul>');
    });

    it('text が要素に変わる（kind が違う）', () => {
      const instance = mount(<p>a</p>, container);

      patch(
        instance,
        <p>
          <b>a</b>
        </p>,
        container,
      );

      expect(container.innerHTML).toBe('<p><b>a</b></p>');
    });

    it('要素が text に変わる（kind が違う）', () => {
      const instance = mount(
        <p>
          <b>a</b>
        </p>,
        container,
      );

      patch(instance, <p>a</p>, container);

      expect(container.innerHTML).toBe('<p>a</p>');
    });
  });

  describe('patch: 関数コンポーネント', () => {
    it('同じコンポーネントは Instance を再利用し、新しい props で関数を再実行する', () => {
      const calls: unknown[] = [];
      const Hello = ({ n }: { n: number }) => {
        calls.push(n);
        return <p>{n}</p>;
      };
      const instance = mount(<Hello n={1} />, container);
      const p = container.firstChild;

      const result = patch(instance, <Hello n={2} />, container);

      expect(result).toBe(instance);
      expect(calls).toEqual([1, 2]);
      expect(container.firstChild).toBe(p);
      expect(container.innerHTML).toBe('<p>2</p>');
    });

    it('hooks は patch をまたいで保持される', () => {
      const Hello = () => <p />;
      const instance = asComponent(mount(<Hello />, container));
      const hooks = instance.hooks;
      hooks.push({ kind: 'state', value: 1 });

      patch(instance, <Hello />, container);

      expect(instance.hooks).toBe(hooks);
      expect(instance.hooks).toEqual([{ kind: 'state', value: 1 }]);
    });

    it('コンポーネントが返す要素の type が変わったら、中身だけ作り直される', () => {
      const Switch = ({ as }: { as: 'div' | 'p' }) => createElement(as, null);
      const instance = asComponent(mount(<Switch as="div" />, container));
      const old = container.firstChild!;

      const result = patch(instance, <Switch as="p" />, container);

      expect(result).toBe(instance);
      expect(getDom(instance)).toBe(container.firstChild);
      expect(container.firstChild).not.toBe(old);
      expect(container.innerHTML).toBe('<p></p>');
    });

    it('コンポーネント自体が別の関数に変わったら作り直す（元の位置に入る）', () => {
      const A = () => <i>a</i>;
      const B = () => <i>b</i>;
      container.appendChild(document.createElement('hr'));
      const instance = mount(<A />, container);
      container.appendChild(document.createElement('br'));

      const result = patch(instance, <B />, container);

      expect(result).not.toBe(instance);
      expect(container.innerHTML).toBe('<hr><i>b</i><br>');
    });

    it('コンポーネントが要素に変わる / 要素がコンポーネントに変わる', () => {
      const Hello = () => <p>hi</p>;
      const a = mount(<Hello />, container);

      const b = patch(a, <div />, container);
      expect(container.innerHTML).toBe('<div></div>');

      patch(b, <Hello />, container);
      expect(container.innerHTML).toBe('<p>hi</p>');
    });

    it('子のコンポーネントも差分更新される', () => {
      const Item = ({ label }: ComponentProps) => <li>{label as string}</li>;
      const instance = mount(
        <ul>
          <Item label="a" />
        </ul>,
        container,
      );
      const li = container.querySelector('li');

      patch(
        instance,
        <ul>
          <Item label="b" />
        </ul>,
        container,
      );

      expect(container.querySelector('li')).toBe(li);
      expect(container.innerHTML).toBe('<ul><li>b</li></ul>');
    });

    it('再実行で不正な値を返したら例外（mount と同じ検査）', () => {
      let bad = false;
      const Flaky = () => (bad ? (null as never) : <p />);
      const instance = mount(<Flaky />, container);

      bad = true;

      expect(() => patch(instance, <Flaky />, container)).toThrow(/コンポーネント/);
    });
  });

  describe('render: 2 回目以降は差分更新になる', () => {
    it('同じ container への 2 回目の render は、DOM を再利用して更新する', () => {
      render(<div id="a">x</div>, container);
      const dom = container.firstChild;

      render(<div id="b">y</div>, container);

      expect(container.firstChild).toBe(dom);
      expect(container.innerHTML).toBe('<div id="b">y</div>');
    });

    it('ルートの type が変わったら差し替わる。container の他の内容は残る', () => {
      container.appendChild(document.createElement('hr'));
      render(<div />, container);

      render(<p />, container);
      render(<span />, container);

      expect(container.innerHTML).toBe('<hr><span></span>');
    });

    it('container ごとに独立している', () => {
      const other = document.createElement('div');
      render(<div>a</div>, container);
      render(<div>b</div>, other);

      render(<div>c</div>, container);

      expect(container.innerHTML).toBe('<div>c</div>');
      expect(other.innerHTML).toBe('<div>b</div>');
    });
  });
});
