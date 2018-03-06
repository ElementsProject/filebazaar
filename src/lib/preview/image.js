import fs     from 'fs-extra'
import gm     from 'gm'
import Canvas from 'canvas'

exports.detect = ({ mime }) => /^image\//.test(mime)

exports.metadata = file => ({ media_type: 'image' })

exports.ext = file => 'png'

exports.preview = async (src, dest) => fs.writeFile(dest, await pixelate(src))

const pixelate = async path => {
  // load original image
  const img  = new Canvas.Image
      , buff = img.src = await fs.readFile(path)

  // make canvas for preview image
  const canvas     = new Canvas(img.width, img.height)
      , ctx        = canvas.getContext('2d')

  ctx.imageSmoothingEnabled = false
  ctx.patternQuality = 'fast'

  // resize left-half to 0.1x, then re-enlarge
  const scaledImg  = new Canvas.Image
  scaledImg.src = await toBuff(gm(buff).crop(img.width/2, img.height, 0, 0).resize(Math.min(img.width*0.1, 80)), 'PNG')
  ctx.drawImage(img, 0, 0, img.width, img.height)
  ctx.drawImage(scaledImg, 0, 0, img.width/2, img.height)

  // add red separator line
  ctx.beginPath()
  ctx.lineWidth = (img.height*0.002)
  ctx.strokeStyle = 'red'
  ctx.moveTo(img.width/2-ctx.lineWidth/2, 0)
  ctx.lineTo(img.width/2-ctx.lineWidth/2, img.height)
  ctx.stroke()

  // add PREVIEW text
  ctx.font         = '' + (img.width*0.1) + 'px arial'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle  = 'black'
  ctx.fillStyle    = 'white'
  ctx.fillText('PREVIEW', img.width/2, img.height/2)
  ctx.strokeText('PREVIEW', img.width/2, img.height/2)

  return toBuff(canvas)
}

const toBuff = (obj, ...a) => new Promise((resolve, reject) => {
  obj.toBuffer(...a, (err, res) => err ? reject(err) : resolve(res))
})
