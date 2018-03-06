import memoize  from 'lru-memoize'
import { exec } from './util'

const importantExif = [ 'Title', 'Artist', 'Band', 'Album', 'Year', 'Genre', 'Track'
                      , 'Megapixels', 'ImageSize', 'Duration', 'VideoFrameRate', 'AudioBitrate'
                      , 'PageCount' ]

module.exports = memoize(path =>
  exec('exiftool', '-j', path)
    .then(r => JSON.parse(r.stdout)[0])
    .then(exif => Object.keys(exif)
      .filter(k => !/^(File|SourceFile|Directory|ExifTool|MIMEType|Picture$)/.test(k) && exif[k])
      .sort((a, b) => importantExif.includes(a) ? -1 : 1)
      .reduce((o, k) => (o[k]=exif[k], o), {}))
    .catch(_ => null) // drop errors, just return null
, 100)
