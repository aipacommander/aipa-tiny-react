// Step 9 でここに、自作 React だけで動くデモ（カウンター / TODO）を書く。
// この時点ではまだ tiny-react の公開 API が無いので、素の DOM で足場だけ置いておく。

const root = document.getElementById('root');
if (!root) throw new Error('#root が見つかりません');

root.textContent = 'Step 0 完了。デモは Step 9 で実装します。';
