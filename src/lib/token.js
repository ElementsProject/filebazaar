import { createHmac } from 'crypto'
import assert         from 'assert'

module.exports = tokenSecret => {
  assert(tokenSecret, 'TOKEN_SECRET is required')

  const hmac = (invoice_id, path, expiry) =>
    createHmac('sha256', tokenSecret)
      .update([ invoice_id, path, expiry ].join('.'))
      .digest().toString('base64').replace(/\W+/g, '')

  const make = (invoice, ttl) => {
    const expiry = invoice.completed_at + ttl
        , hash   = hmac(invoice.id, invoice.metadata.path, expiry)

    return [ invoice.id, expiry.toString(36), hash ].join('.')
  }

  const parse = (path, token) => {
    const [ invoice_id, expiry_, hash ] = token.split('.')
        , expiry = parseInt(expiry_, 36)

    return hmac(invoice_id, path, expiry) === hash
      && expiry > Date.now()/1000
      && { token, path, invoice_id, expiry }
  }

  return { make, parse }
}
