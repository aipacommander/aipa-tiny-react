import { createElement, Fragment, mount, render } from '../src/tiny-react';
import type { ComponentFn, ComponentProps, ElementVNode, Props } from '../src/tiny-react';

/**
 * Step 3 の仕様。このファイルは編集しないこと。
 *
 * 関数コンポーネントは「props を受け取って VNode を返す関数」。
 * <Hello name="a" /> は createElement(Hello, { name: 'a' }) に変換される。
 */

let container: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = '';
  container = document.createElement('div');
  document.body.appendChild(container);
});

describe('Step 3: 関数コンポーネント', () => {
  describe('基本', () => {
    it('コンポーネントが返した要素が DOM になる', () => {
      const Hello = () => <p>hi</p>;

      render(<Hello />, container);

      expect(container.innerHTML).toBe('<p>hi</p>');
    });

    it('props が渡される', () => {
      const Greeting = ({ name }: { name: string }) => <h1>Hello, {name}</h1>;

      render(<Greeting name="aipa" />, container);

      expect(container.innerHTML).toBe('<h1>Hello, aipa</h1>');
    });

    it('関数は 1 回だけ、正規化された props（children 付き）で呼ばれる', () => {
      const received: Props[] = [];
      const Spy = (props: ComponentProps) => {
        received.push(props as Props);
        return <i />;
      };

      render(<Spy label="x" key="k" />, container);

      // key は props に入らない。子が無ければ children は空配列
      expect(received).toEqual([{ label: 'x', children: [] }]);
    });
  });

  describe('children の受け渡し', () => {
    const Box = ({ children }: ComponentProps) => <div className="box">{children}</div>;

    it('props.children として子が渡り、そのまま描画できる', () => {
      render(
        <Box>
          <span>a</span>b
        </Box>,
        container,
      );

      expect(container.innerHTML).toBe('<div class="box"><span>a</span>b</div>');
    });

    it('子が無ければ空になる', () => {
      render(<Box />, container);

      expect(container.innerHTML).toBe('<div class="box"></div>');
    });
  });

  describe('入れ子', () => {
    it('コンポーネントが別のコンポーネントを返せる', () => {
      const Inner = () => <b>x</b>;
      const Outer = () => <Inner />;

      render(<Outer />, container);

      expect(container.innerHTML).toBe('<b>x</b>');
    });

    it('要素の子としてコンポーネントを並べられる', () => {
      const Item = ({ n }: { n: number }) => <li>{n}</li>;

      render(
        <ul>
          <Item n={1} />
          <Item n={2} />
        </ul>,
        container,
      );

      expect(container.innerHTML).toBe('<ul><li>1</li><li>2</li></ul>');
    });

    it('コンポーネントの中のコンポーネントにも props が渡る', () => {
      const Label = ({ text }: { text: string }) => <em>{text}</em>;
      const Card = ({ title }: { title: string }) => (
        <section>
          <Label text={title} />
        </section>
      );

      render(<Card title="t" />, container);

      expect(container.innerHTML).toBe('<section><em>t</em></section>');
    });

    it('コンポーネントは自分の DOM を持たず、container にそのまま入る', () => {
      const Hello = () => <p>hi</p>;

      render(
        <div>
          <Hello />
        </div>,
        container,
      );

      // <Hello> という DOM は存在しない
      expect(container.innerHTML).toBe('<div><p>hi</p></div>');
    });
  });

  describe('Instance', () => {
    it('ComponentInstance を返し、child に描画結果の Instance を持つ', () => {
      const Hello = () => <p>hi</p>;
      const vnode = (<Hello />) as ElementVNode;

      const instance = mount(vnode, container);

      if (instance.kind !== 'component') throw new Error('component ではない');
      expect(instance.vnode).toBe(vnode);
      expect(instance.hooks).toEqual([]);
      expect(instance.hookIndex).toBe(0);
      expect(instance.container).toBe(container);
      if (instance.child?.kind !== 'host') throw new Error('child が host ではない');
      expect(instance.child.dom).toBe(container.firstChild);
    });

    it('入れ子のコンポーネントは child が連なる', () => {
      const Inner = () => <b>x</b>;
      const Outer = () => <Inner />;

      const outer = mount((<Outer />) as ElementVNode, container);

      if (outer.kind !== 'component') throw new Error('component ではない');
      const inner = outer.child;
      if (inner?.kind !== 'component') throw new Error('inner が component ではない');
      expect(inner.child?.kind).toBe('host');
    });
  });

  describe('不正な戻り値', () => {
    // メッセージに「コンポーネント」を含めること（どのコンポーネントの何が駄目かが分かる文面にする）
    const renderBad = (fn: unknown) => () =>
      render(createElement(fn as ComponentFn, null), container);

    it('null を返したら例外', () => {
      expect(renderBad(() => null)).toThrow(/コンポーネント/);
    });

    it('undefined を返したら例外（return を書き忘れた場合）', () => {
      expect(renderBad(() => undefined)).toThrow(/コンポーネント/);
    });

    it('文字列を返したら例外', () => {
      expect(renderBad(() => 'hi')).toThrow(/コンポーネント/);
    });

    it('配列を返したら例外', () => {
      expect(renderBad(() => [<p />, <p />])).toThrow(/コンポーネント/);
    });

    it('Fragment を返したら例外', () => {
      expect(renderBad(() => (
        <>
          <p />
        </>
      ))).toThrow(/コンポーネント/);
    });
  });
});
