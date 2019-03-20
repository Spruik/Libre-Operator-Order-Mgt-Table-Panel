import { appEvents } from 'app/core/core'

const hostname = window.location.hostname
const postgRestHost = 'http://' + hostname + ':5436/'
const influxHost = 'http://' + hostname + ':8086/'

let post = (url, line) => {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.onreadystatechange = handleResponse
      xhr.onerror = e => reject(e)
      xhr.send(line)
  
      function handleResponse () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            // console.log('200');
            var res = JSON.parse(xhr.responseText)
            resolve(res)
          } else if (xhr.status === 204) {
            // console.log('204');
            res = xhr.responseText
            resolve(res)
          } else {
            reject(this.statusText)
          }
        }
      }
    })
  }

  let get = url => {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', url)
        xhr.onreadystatechange = handleResponse
        xhr.onerror = e => reject(e)
        xhr.send()

        function handleResponse () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var res = JSON.parse(xhr.responseText)
            resolve(res)
            } else {
              reject(this.statusText)            
            }
        }
        }
    })
  }

  const alert = (type, title, msg) => {
      appEvents.emit('alert-' + type, [title, msg])
  }

  export { post, get, postgRestHost, influxHost, alert }