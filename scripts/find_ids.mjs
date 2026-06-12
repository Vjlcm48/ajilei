import { readFileSync } from 'fs'
const src = readFileSync('c:/Users/victo/OneDrive/Documents/ajilei/src/assets/baraja2.svg', 'utf8')
const ids = [...src.matchAll(/id="([^"]+)"/g)].map(m => m[1])
const cardLike = ids.filter(id =>
  /^[a-z]/.test(id) &&
  !/^(path|rect|use|stop|linear|radial|g[0-9]|svg|defs|named|layer|flow|text|tspan|clip|mask|pattern|filter|fe|image|marker|symbol|desc|title|metadata|cc|rdf|dc)/.test(id)
)
console.log([...new Set(cardLike)].join('\n'))
