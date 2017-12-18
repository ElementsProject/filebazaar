(function(){

  document.querySelectorAll('[data-countdown-to]').forEach(function(el) {
    var parent  = el.parentNode
      , expires = +el.dataset.countdownTo

    function update() {
      var left = expires - (+new Date()/1000|0)
      if (left > 0) el.innerHTML = 'in ' + formatDur(left)
      else location.reload()
    }
    update()
    setInterval(update, 1000)
  })

  function formatDur(x) {
    var h=x/3600|0, m=x%3600/60|0, s=x%60
    return ''+(h>0?h+':':'')+(m<10&&h>0?'0':'')+m+':'+(s<10?'0':'')+s
  }

})()
