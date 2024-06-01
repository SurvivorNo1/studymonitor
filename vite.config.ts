import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 使用环境变量来设置基路径，如果没有设置环境变量则默认为 '/'
const base =  '/'

export default defineConfig({
  base: base,
  plugins: [react()],
})
