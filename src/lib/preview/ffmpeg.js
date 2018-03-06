import { exec } from '../util'

exports.detect = ({ mime }) => /^(video|audio)\//.test(mime)

exports.ext = file => ~file.mime.indexOf('video/') ? 'mp4' : 'mp3'

exports.metadata = file => ({ media_type: file.mime.split('/')[0] })

exports.preview = (src, dest) =>
  exec('ffmpeg', '-t', 30, '-i', src, '-acodec', 'copy', '-vcodec', 'copy', dest)
