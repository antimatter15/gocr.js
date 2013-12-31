function GOCR(image){
	Module = {
		arguments: ['-i', 'in.pnm', '-f', 'UTF8']
	}
	
	if(image.getContext) image = image.getContext('2d');
	if(image.getImageData) image = image.getImageData(0, 0, image.canvas.width, image.canvas.height);
	// if(image.data){
	var width = image.width, height = image.height;
	var header = "P5\n" + width + " " + height + "\n255\n";
	var dst = new Uint8Array(header.length + width * height);
	var src = image.data;
	var srcLength = src.length | 0, srcLength_16 = (srcLength - 16) | 0;
	var j = header.length;
	for(var i = 0; i < j; i++){
		dst[i] = header.charCodeAt(i) // write the header
	}
	var coeff_r = 4899, coeff_g = 9617, coeff_b = 1868;

	for (var i = 0; i <= srcLength_16; i += 16, j += 4) {
		dst[j]     = (src[i] * coeff_r + src[i+1] * coeff_g + src[i+2] * coeff_b + 8192) >> 14;
		dst[j + 1] = (src[i+4] * coeff_r + src[i+5] * coeff_g + src[i+6] * coeff_b + 8192) >> 14;
		dst[j + 2] = (src[i+8] * coeff_r + src[i+9] * coeff_g + src[i+10] * coeff_b + 8192) >> 14;
		dst[j + 3] = (src[i+12] * coeff_r + src[i+13] * coeff_g + src[i+14] * coeff_b + 8192) >> 14;
	}
	for (; i < srcLength; i += 4, ++j) {
		dst[j] = (src[i] * coeff_r + src[i+1] * coeff_g + src[i+2] * coeff_b + 8192) >> 14;
	}

	var recognizedText = "";
	var utf8;
	Module['preRun'] = function(){
	  utf8 = new Runtime.UTF8Processor();
	  FS.writeFile('/in.pnm', dst, { encoding: 'binary' })
	}

	
	Module['stdout'] = function(x){
		recognizedText += utf8.processCChar(x)
	}
	// Module['print'] = function(text) {
	// console.log('print', text)
	// }
	// Module['abort'] = function(){
	// 	console.log('aborted')
	// }
	// Module['printErr'] = function(text) {
	// console.error(text)
	// }