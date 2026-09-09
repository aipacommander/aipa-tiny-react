import { defineConfig } from 'vitest/config';

export default defineConfig({
  // JSX を自作の createElement / Fragment に変換する。
  //   <div id="a">hi</div>  ->  createElement('div', { id: 'a' }, 'hi')
  //
  // Vite 8 のトランスフォーマは esbuild ではなく oxc。esbuild.* を書いても無視される。
  // 変換は oxc が行い、tsc は型チェックのみを担当する（tsconfig.json の jsxFactory）。
  //
  // jsxInject 相当の自動 import はあえて使わない。各ファイルで createElement を明示的に
  // import させ、「JSX が関数呼び出しに変換されている」ことを常に見える形にするため。
  oxc: {
    jsx: {
      runtime: 'classic',
      pragma: 'createElement',
      pragmaFrag: 'Fragment',
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
