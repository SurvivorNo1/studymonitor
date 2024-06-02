import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const base = '/studymonitor/'

export default defineConfig({
  base: base,
  plugins: [react()],
})
