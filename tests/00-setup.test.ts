/**
 * Step 0: 環境の疎通確認。
 * 実装課題ではない。テストランナーと DOM 環境が動いていることだけを確かめる。
 */
describe('Step 0: 環境構築', () => {
  it('happy-dom の document が使える', () => {
    const div = document.createElement('div');
    div.textContent = 'hello';
    document.body.appendChild(div);

    expect(document.body.innerHTML).toBe('<div>hello</div>');
  });
});
