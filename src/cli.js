#!/usr/bin/env node
const path   = require('path')
    , crypto = require('crypto')
    , fs     = require('fs')

require('babel-polyfill')

const templatePath = path.join(__dirname, '..', '_filebazaar.yaml.example')

if (process.argv[2] === 'init') {
  const directory   = process.argv[3] || process.cwd()
      , configPath  = path.join(directory, '_filebazaar.yaml')

  if (fs.existsSync(configPath)) throw new Error(`${configPath} already exists`)

  fs.writeFileSync(configPath, fs.readFileSync(templatePath).toString()
    .replace('$TOKEN_SECRET', crypto.randomBytes(32).toString('hex')))

  console.log('FileBazaar config written to %s', configPath)
} else {
  require('./app')
}
