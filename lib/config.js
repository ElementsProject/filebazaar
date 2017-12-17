import path   from 'path'
import assert from 'assert'
import fs     from 'fs-extra'
import yaml   from 'js-yaml'

// Initialize config from `configPath`,
// can be either the base directory or the full path to _filebazaar.yaml
module.exports = basePath => {
  const configPath = fs.statSync(basePath).isFile() ? basePath : path.join(basePath, '_filebazaar.yaml')
      , config     = fs.existsSync(configPath) ? yaml.safeLoad(fs.readFileSync(configPath)) : {}

  config.env           = config.env          || process.env.NODE_ENV     || 'development'
  config.host          = config.host         || process.env.HOST         || 'localhost'
  config.port          = config.port         || process.env.PORT         || 9678
  config.url           = config.url          || process.env.URL          || `http://${config.host}:${config.port}/`
  config.proxied       = config.proxied      || process.env.PROXIED      || false

  config.directory     = config.directory    || process.env.BASE_DIR     || path.dirname(configPath)
  config.token_secret  = config.token_secret || process.env.TOKEN_SECRET || assert(false, 'token_secret is required')
  config.cache_path    = config.cache_path   || process.env.CACHE_PATH   || path.join(config.directory, '_filebazaar_cache')

  config.kite_url      = config.kite_url     || process.env.KITE_URL     || 'http://localhost:9112'
  config.kite_token    = config.kite_token   || process.env.KITE_TOKEN

  config.invoice_ttl   = config.invoice_ttl  || +process.env.INVOICE_TTL || 3600   // 1 hour
  config.access_ttl    = config.access_ttl   || +process.env.ACCESS_TTL  || 172800 // 2 days

  config.views_dir     = config.views_dir    || process.env.VIEWS_DIR    || path.join(__dirname, '..', 'views')
  config.static_dir    = config.static_dir   || process.env.STATIC_DIR   || path.join(__dirname, '..', 'static')
  config.theme         = config.theme        || process.env.THEME        || 'yeti'
  config.css           = config.css          || process.env.CSS

  config.files         = parseFiles(config.files || (process.env.FILES_JSON ? JSON.parse(process.env.FILES_JSON) : {}))
  config.default_price = parsePrice(config.default_price || process.env.DEFAULT_PRICE || '0.25 USD')

  fs.ensureDirSync(config.cache_path)

  return config
}

const parsePrice = str => {
  const m = str.match(/^([\d.]+) ([a-z]+)$/i)
  if (!m) throw new Error(`invalid price: ${ str }`)
  return { amount: m[1], currency: m[2] }
}

const parseFiles = (files, prefix='') =>
  Object.keys(files)
    .reduce((o, name) =>
      (name[name.length-1] === '/'
        ? files[name] && Object.assign(o, parseFiles(files[name], prefix + name))
        : o[prefix+name] = parseFile(files[name])
      , o)
    , {})

const parseFile = file =>
  typeof file === 'string'
    ? { price: parsePrice(file) }
    : { ...file, price: file.price && parsePrice(file.price) }

