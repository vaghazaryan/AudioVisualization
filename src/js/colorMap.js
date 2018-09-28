class ColorMap {

    static arrayFromRGB(str) {
        return str.match(/(\d{1,3})/g);
    }

    static rgbFromArray(arr) {
        return `rgb(${arr.join(',')})`
    }

    static hexFromRGB(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1,7);
    }

    static rgbFromHex(hex) {
        return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
            ,(m, r, g, b) => '#' + r + r + g + g + b + b)
            .substring(1).match(/.{2}/g)
            .map(x => parseInt(x, 16))
    }

    constructor(opt){
        if(!opt) throw Error('Not passed a parameters to the constructor');
        if(!Array.isArray(opt) || (typeof opt).toLowerCase() !== 'object') {
            throw Error(`Type of passed parameter '${(typeof opt).toUpperCase()}:' not supported. 
				Please pass Array of colors or Object`);
        }
        this.outputType   		= opt.type || 'rgb'; // Currently supported two types 'rgb' and 'hex'
        this.inputColors  		= this._setInputColors(opt);
        this.colorFormat		= this._checkColorFormat();
        this.colorGradientMap   = this.gradientMap;

    }

    _checkColorFormat() {
        let isHex = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(this.inputColors[0]);
        let isRGB = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/.test(this.inputColors[0])
        return (isHex || isRGB) ? (isHex ? 'hex' : 'rgb' ) : null;
    }

    _setInputColors(opt) {
        return Array.isArray(opt) ? opt : opt.colors;
    }

    _goToEqualize(a,b){
        if(a == b) return a;
        return (a - b >= 0) ? --a : ++a
    }

    _initGradientMap(arr) {
        let colorsGradient = [];
        arr.reduce((a,b) => {
            let c1  = Array.from(a);
            let c2  = Array.from(b);
            colorsGradient.push(this.constructor.rgbFromArray(c1));
            do{
                c1[0] = this._goToEqualize(c1[0], c2[0]);
                c1[1] = this._goToEqualize(c1[1], c2[1]);
                c1[2] = this._goToEqualize(c1[2], c2[2]);
                colorsGradient.push(this.constructor.rgbFromArray(c1));
            }while(c1.toString() !== c2.toString());
            return b;
        });
        return colorsGradient;
    }

    get matrixArray() {
        return this.inputColors.map(color => this.colorFormat === 'hex'
            ? this.constructor.rgbFromHex(color)
            : this.constructor.arrayFromRGB(color));
    }

    get gradientMap() {
        return this._initGradientMap(this.matrixArray);
    }

    animate(callback, milis, loop) {
        let counter = 0;
        let timer = setInterval(() => {
            if(counter >= this.colorGradientMap.length - 1){
                clearInterval(timer);
                if(loop) this.animate(callback, milis, loop);
            };
            callback(this.colorGradientMap[counter]);
            counter++;
        }, milis / this.colorGradientMap.length - 1);
    }
}