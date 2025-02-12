// CommonJS wrapper for fflate
const fflate = require('fflate')

module.exports = {
  deflate: fflate.deflate,
  inflate: fflate.inflate,
  gzip: fflate.gzip,
  ungzip: fflate.ungzip,
  strToU8: fflate.strToU8,
  strFromU8: fflate.strFromU8
} 