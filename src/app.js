import { pwrap, pick, fcurrency, fmsat, pngPixel } from './lib/util'

// Setup
const app     = require('express')()
    , conf    = require('./lib/config')(process.argv[2] || process.cwd())
    , charge  = require('lightning-charge-client')(conf.charge_url, conf.charge_token)
    , files   = require('./lib/files')(conf.directory, conf.default_price, conf.invoice_ttl, conf.files)
    , tokenr  = require('./lib/token')(conf.token_secret)
    , preview = require('./lib/preview')(files, conf.cache_path)

// Express settings
app.set('trust proxy', conf.proxied)
app.set('env', conf.env)

app.set('view engine', 'pug')
app.set('views', conf.views_dir)

app.enable('json escape')
app.enable('strict routing')
app.enable('case sensitive routing')

// View locals
Object.assign(app.locals, {
  conf, fmsat, fcurrency
, prettybytes: require('pretty-bytes')
, markdown:    require('markdown-it')()
, qruri:       require('qruri')
, version:     require('../package').version
, pretty:      (conf.env === 'development')
})

// Middlewares
app.get('/favicon.ico', (req, res) => res.sendStatus(204)) // to prevent logging
app.use(require('morgan')('dev'))
app.use(require('cookie-parser')())
app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({ extended: false }))
app.use(require('csurf')({ cookie: true }))

// Static assets
app.use('/_assets', require('stylus').middleware({ src: conf.static_dir, serve: true }))
app.use('/_assets', require('express').static(conf.static_dir))

// Create invoice
app.post('/_invoice', pwrap(async (req, res) => {
  const file = await files.load(req.body.file)
  if (file.type !== 'file') return res.sendStatus(405)

  const invoice = await charge.invoice(files.invoice(file))
  res.status(201).format({
    html: _ => res.redirect(file.urlpath + '?invoice=' + invoice.id)
  , json: _ => res.send(pick(invoice, 'id', 'msatoshi', 'quoted_currency', 'quoted_amount', 'payreq'))
  })
}))

// Payment updates long-polling via <img> hack
app.get('/_invoice/:invoice/longpoll.png', pwrap(async (req, res) => {
  const paid = await charge.wait(req.params.invoice, 100)
  if (paid !== null) res.type('png').send(pngPixel)
  else res.sendStatus(402)
  // @TODO close charge request on client disconnect
}))

// File browser
app.get('/:rpath(*)', pwrap(async (req, res) => {
  const file = await files.load(req.params.rpath)
  if (file.type == 'dir') return res.render('dir', file)

  const invoice = req.query.invoice && await charge.fetch(req.query.invoice)
      , access  = req.query.token   && tokenr.parse(file.path, req.query.token)

  if (access) {
    if ('download' in req.query)  res.type(file.mime).download(file.fullpath)
    else if ('view' in req.query) res.type(file.mime).sendFile(file.fullpath)
    else res.render('file', { ...file, access })
  }

  else if (invoice) {
    if (invoice.status == 'paid') res.redirect(escape(file.name) + '?token=' + tokenr.make(invoice, conf.download_ttl))
    else res.render('file', { ...file, invoice })
  }

  else if ('preview' in req.query) await preview.handler(file, res)

  else res.render('file', { ...file, csrf: req.csrfToken(), preview: await preview.metadata(file) })
}))

// Normalize errors to HTTP status codes
app.use((err, req, res, next) =>
  err.syscall === 'stat' && err.code == 'ENOENT' ? res.sendStatus(404)
: err.message === 'not found'                    ? res.sendStatus(404)
: err.message === 'forbidden'                    ? res.sendStatus(403)
: next(err))

// Go!
app.listen(conf.port, conf.host, _ => console.log('FileBazaar serving %s on port %d, browse at %s', conf.directory, conf.port, conf.url))

// strict handling for uncaught promise rejections
process.on('unhandledRejection', err => { throw err })
