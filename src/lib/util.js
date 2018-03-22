import { execFile }  from 'child_process'
import { btc2milli } from 'fmtbtc'
import CurrencyF     from 'currency-formatter'

// Promise wrapper for express handler functions
const pwrap = fn => (req, res, next, ...a) =>
  fn(req, res, next, ...a).catch(next)

// Promise wrapper for execFile
const exec = (cmd, ...args) => new Promise((resolve, reject) =>
  execFile(cmd, args, (err, stdout, stderr) =>
    err ? reject(err) : resolve({ stderr, stdout })))

// Pick specified object properties
const pick = (O, ...K) => K.reduce((o, k) => (o[k]=O[k], o), {})

// Format price with currency symbol
//
const fcurrency = p => p.currency === 'BTC' ? `${btc2milli(p.amount, true)} mBTC`
                       : CurrencyF.format(p.amount, { code: p.currency })

// Empty 1x1 PNG pixel
const pngPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')

module.exports = { pwrap, exec, pick, fcurrency, pngPixel }
