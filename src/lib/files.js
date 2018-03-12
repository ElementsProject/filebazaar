import crypto    from 'crypto'
import upath     from 'path'
import fs        from 'fs-extra'

import memoize   from 'lru-memoize'
import prettyb   from 'pretty-bytes'
import fileExt   from 'file-extension'
import fileType  from 'file-type'
import mimeTypes from 'mime-types'
import readChunk from 'read-chunk'

import getExif   from './exif'

const reIgnore = /^[._]/

module.exports = (base, default_price, invoice_ttl, files_attr) => {

  const load = async (_path, shallow=false) => {
    const fullpath = upath.resolve(base, _path)
        , relpath  = upath.relative(base, fullpath)
        , dirname  = upath.dirname(relpath)
        , name     = upath.basename(relpath)
        , ext      = fileExt(name)
        , attr     = files_attr[relpath] || {}

    if (/^\.\.\//.test(relpath) || reIgnore.test(name)) throw new Error('forbidden')

    const file = { fullpath, path: relpath, urlpath: escape(relpath), name, ext, dirname }
        , stat = await fs.stat(fullpath)

    return stat.isDirectory() ? { ...file, type: 'dir', files: !shallow && await listFiles(fullpath) }
         : stat.isFile()      ? { ...file, type: 'file', size: stat.size, attr, price: attr.price || default_price
                                , mime: await getMime(file), exif: !shallow && await getExif(fullpath) }
         : null
  }

  const listFiles = async path =>
    (await Promise.all((await fs.readdir(path))
      .filter(name => !reIgnore.test(name))
      .map(name => load(upath.join(path, name), true))))
    .filter(file => !!file)
    .sort((a, b) => a.type == 'dir' ? -1 : 1)

  const getMime = async ({ fullpath, ext }) =>
    ext && mimeTypes.lookup(ext) || await detectType(fullpath)

  const detectType = memoize(async path => {
    const type = fileType(await readChunk(path, 0, 4100))
    return type && type.mime
  }, 100)

  const getHash = memoize(path => new Promise((resolve, reject) =>
    fs.createReadStream(path).pipe(crypto.createHash('sha256').setEncoding('hex'))
      .on('finish', function() { resolve(this.read()) })
      .on('error', reject)
  ), 100)

  const invoice = file => ({
    description: `Pay to access ${ file.path }, size=${ prettyb(file.size) }, mime=${ file.mime||'-' }` //, sha256=${ await getHash(file.full.path) }`
  , currency:    file.price.currency
  , amount:      file.price.amount
  , expiry:      invoice_ttl
  , metadata:    { source: 'filebazaar', path: file.path }
  })

  return { load, invoice }
}
