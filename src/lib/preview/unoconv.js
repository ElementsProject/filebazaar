import { exec } from '../util'

const supported = [ 'pdf', 'doc', 'docx', 'odt', 'odt', 'bib', 'rtf', 'latex', 'csv', 'xls', 'xlsx', 'ods' ]

exports.detect = ({ ext }) => supported.includes(ext)

exports.ext = file => 'png'

exports.metadata = file => ({ media_type: 'doc' })

exports.preview = (src, dest) => exec('unoconv', '-o', dest, src)
