import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/umd/canvas-grid-lines.js',
        format: 'umd',
        name: 'canvasGridLines',
        sourcemap: true,
    },
    plugins: [
        typescript({ tsconfig: './tsconfig.rollup.json' }),
        nodeResolve(),
    ],
};
