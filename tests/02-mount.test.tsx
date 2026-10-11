import { createElement, mount, render } from '../src/tiny-react';
import type { ElementVNode, TextVNode } from '../src/tiny-react';

/**
 * Step 2 の仕様。このファイルは編集しないこと。
 *
 * Step 2 以降は JSX で書く。<div /> は createElement('div', ...) に変換される
 * （そのため createElement の import が必要）。
 */

let container: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = '';
  container = document.createElement('div');
  document.body.appendChild(container);
});

describe('Step 2: mount / render', () => {
  describe('構造', () => {
    it('タグと子のテキストが DOM になる', () => {
      render(<div>hi</div>, container);

      expect(container.innerHTML).toBe('<div>hi</div>');
    });

    it('入れ子の要素が順番どおりに入る', () => {
      render(
        <ul>
          <li>a</li>
          <li>b</li>
        </ul>,
        container,
      );

      expect(container.innerHTML).toBe('<ul><li>a</li><li>b</li></ul>');
    });

    it('テキストと要素が混ざっていても順序を保つ', () => {
      render(
        <p>
          a<b>b</b>c
        </p>,
        container,
      );

      expect(container.innerHTML).toBe('<p>a<b>b</b>c</p>');
    });

    it('数値の子は文字列になる。0 も表示される', () => {
      render(<p>{0}</p>, container);

      expect(container.innerHTML).toBe('<p>0</p>');
    });

    it('false / null の子は何も出さない', () => {
      render(
        <p>
          {false}
          {null}
        </p>,
        container,
      );

      expect(container.innerHTML).toBe('<p></p>');
    });

    it('テキストは HTML として解釈されず、文字列のまま出る', () => {
      render(<p>{'<b>x</b>'}</p>, container);

      expect(container.innerHTML).toBe('<p>&lt;b&gt;x&lt;/b&gt;</p>');
      expect(container.querySelector('b')).toBeNull();
    });

    it('container に元からある内容の後ろに追加される', () => {
      container.appendChild(document.createElement('hr'));

      render(<div />, container);

      expect(container.innerHTML).toBe('<hr><div></div>');
    });
  });

  describe('props: 属性', () => {
    it('普通の props は属性になる。数値は文字列化される', () => {
      render(<div id="a" data-n={3} />, container);

      const el = container.firstElementChild!;
      expect(el.getAttribute('id')).toBe('a');
      expect(el.getAttribute('data-n')).toBe('3');
    });

    it('className は class 属性になる', () => {
      render(<div className="box big" />, container);

      const el = container.firstElementChild!;
      expect(el.getAttribute('class')).toBe('box big');
      expect(el.hasAttribute('classname')).toBe(false);
    });

    it('true は空の属性、false / null / undefined は付けない', () => {
      render(<input disabled={true} readonly={false} title={null} lang={undefined} />, container);

      const el = container.firstElementChild!;
      expect(el.getAttribute('disabled')).toBe('');
      expect(el.hasAttribute('readonly')).toBe(false);
      expect(el.hasAttribute('title')).toBe(false);
      expect(el.hasAttribute('lang')).toBe(false);
    });

    it('key と children は属性にならない', () => {
      render(<div key="k">x</div>, container);

      const el = container.firstElementChild!;
      expect(el.hasAttribute('key')).toBe(false);
      expect(el.hasAttribute('children')).toBe(false);
    });
  });

  describe('props: イベント', () => {
    it('onClick は click イベントのリスナーになる', () => {
      const calls: Event[] = [];
      render(<button onClick={(e: Event) => calls.push(e)}>go</button>, container);

      container.querySelector('button')!.click();

      expect(calls).toHaveLength(1);
      expect(calls[0]).toBeInstanceOf(Event);
    });

    it('イベント名は on を除いて小文字にする（onMouseDown -> mousedown）', () => {
      let called = 0;
      render(<div onMouseDown={() => called++} />, container);

      container.firstElementChild!.dispatchEvent(new Event('mousedown'));

      expect(called).toBe(1);
    });

    it('属性（onclick="..."）としては付けない', () => {
      render(<button onClick={() => {}} />, container);

      const el = container.firstElementChild!;
      expect(el.hasAttribute('onclick')).toBe(false);
      expect(el.hasAttribute('onClick')).toBe(false);
    });
  });

  describe('props: style', () => {
    it('style オブジェクトが要素のスタイルになる', () => {
      render(<div style={{ color: 'red', fontSize: '12px' }} />, container);

      const el = container.firstElementChild as HTMLElement;
      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('12px');
    });
  });

  describe('Instance', () => {
    it('テキストは TextInstance を返す', () => {
      const vnode: TextVNode = { kind: 'text', text: 'hi', key: null };

      const instance = mount(vnode, container);

      if (instance.kind !== 'text') throw new Error('text ではない');
      expect(instance.vnode).toBe(vnode);
      expect(instance.dom).toBe(container.firstChild);
      expect(container.textContent).toBe('hi');
    });

    it('要素は HostInstance を返し、dom と子の Instance を持つ', () => {
      const vnode = (
        <div>
          <span>a</span>b
        </div>
      ) as ElementVNode;

      const instance = mount(vnode, container);

      if (instance.kind !== 'host') throw new Error('host ではない');
      expect(instance.vnode).toBe(vnode);
      expect(instance.dom).toBe(container.firstChild);
      expect(instance.children.map((c) => c.kind)).toEqual(['host', 'text']);
      // 子の Instance が指す DOM は、実際に親 DOM の子として入っているものと同一
      const [span, b] = instance.children;
      if (span.kind !== 'host' || b.kind !== 'text') throw new Error('子の kind が違う');
      expect(span.dom).toBe(instance.dom.childNodes[0]);
      expect(b.dom).toBe(instance.dom.childNodes[1]);
    });
  });

  describe('render', () => {
    it('container の中に描画される', () => {
      render(<div />, container);

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('container が要素でなければ、container に触れた例外を投げる', () => {
      // メッセージに "container" を含めること（なぜ駄目かが分かる文面にする）
      expect(() => render(<div />, null as unknown as HTMLElement)).toThrow(/container/);
      expect(() => render(<div />, {} as unknown as HTMLElement)).toThrow(/container/);
    });
  });
});
