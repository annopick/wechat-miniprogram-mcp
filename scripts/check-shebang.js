import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const distPath = join(__dirname, '..', 'dist', 'index.js')
const content = readFileSync(distPath, 'utf8')
const lines = content.split('\n')
const shebangLines = lines.filter(line => line.startsWith('#!'))

if (shebangLines.length > 1) {
  console.error(`Error: Found ${shebangLines.length} shebang lines in dist/index.js`)
  shebangLines.forEach((line, i) => {
    console.error(`  Line ${i + 1}: ${line}`)
  })
  process.exit(1)
}

console.log('Shebang check passed')
