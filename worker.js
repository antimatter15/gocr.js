importScripts('gocr.js')
onmessage = function(e){
	postMessage(GOCR(e.data))
}