class Player {

    static msToTime(ms) {
        return new Date(ms).toISOString().slice(11, -8);
    }

    constructor(DOMSelector){
        this.audioSource = null;
        this.fft = null;
        this.DOMSelector = DOMSelector || '.player';
        this._volume = 0.8;
        this._lastVolumePoint = this.volume;
        this._isTraceTouched = false;
        this._mouseTimeout = null;
        this._listeners = [];
        this._playlist = [];
    }

    set volume(vol) {
        this._volume = vol;
        this.audioSource.setVolume(vol);
        this.triggerVolumeButton();
    }

    get volume() {
        return this._volume;
    }

    updateVolumeTrace() {
        this.controls.volume.value = this.volume;
    }

    set traceTime(sec) {
        if(!this._isTraceTouched) this.controls.trace.value = sec;
        this.controls.currentTime.innerHTML = Player.msToTime(sec * 60 * 1000);
    };

    set traceEndTime(sec) {
        this.controls.trace.max = sec;
        this.controls.endTime.innerHTML = Player.msToTime(sec * 60 * 1000);
    }

    get selector(){
        return this.DOMSelector;
    }

    get target(){
        return document.querySelector(this.selector);
    }

    get controls(){
        return {
            stop:         this.target.querySelector('#stop'),
            playPause:    this.target.querySelector('#playPause'),
            next:         this.target.querySelector('#next'),
            prev:         this.target.querySelector('#prev'),
            trace:        this.target.querySelector('#trace'),
            muteSound:    this.target.querySelector('#muteSound'),
            volume:       this.target.querySelector('#volume'),

            currentTime:  this.target.querySelector('.current-time'),
            endTime:      this.target.querySelector('.end-time'),
        }
    }

    show(){
        document.querySelector(this.selector).classList.add('show');
    }

    hide(){
        document.querySelector(this.selector).classList.remove('show');
    }

    play() {
        this.audioSource.play();
        this.controls.playPause.firstElementChild.classList.add('i-pause');
        this.controls.playPause.firstElementChild.classList.remove('i-play');
    }

    pause() {
        this.audioSource.pause();
        this.controls.playPause.firstElementChild.classList.add('i-play');
        this.controls.playPause.firstElementChild.classList.remove('i-pause');
    }

    stop() {
        this.pause();
        this.audioSource.stop();
    }

    next(){
        let currentIndex = this._playlist.indexOf(this.audioSource);
        if(!this._playlist[currentIndex + 1]) return;
        this.setTrack(currentIndex + 1);
        this.setControlsActivity();
        this.play();
    }

    prev(){
        let currentIndex = this._playlist.indexOf(this.audioSource);
        if(!this._playlist[currentIndex - 1]) return;
        this.setTrack(currentIndex - 1);
        this.setControlsActivity();
        this.play();
    }

    setTrack(index){
        if(this.audioSource) this.stop();
        this.audioSource = this._playlist[index];
        this.triggerEvent('trackChange');
    }

    setTimestamp() {
        setInterval(() => {
            this.traceTime = this.audioSource.currentTime();
        },100)
    }

    triggerVolumeButton(){
        this.controls.muteSound.firstElementChild.classList.add(this.volume ? 'i-volume' : 'i-mute')
        this.controls.muteSound.firstElementChild.classList.remove(this.volume ? 'i-mute' : 'i-volume')
    }

    setControlsActivity() {
        let currentIndex = this._playlist.indexOf(this.audioSource);
        this.controls.prev.disabled = !currentIndex;
        this.controls.next.disabled = !this._playlist[currentIndex + 1];
    }

    initEventHandlers() {
        this.controls.playPause.addEventListener('click', e => {
            this.audioSource.isPlaying() ? this.pause() : this.play();
        });

        this.controls.muteSound.addEventListener('click', e => {
            this.volume = this.audioSource.getVolume() ?  0 : this._lastVolumePoint;
            this.triggerVolumeButton();
            this.updateVolumeTrace();
        });

        this.controls.stop.addEventListener('click', e => this.stop.apply(this));
        this.controls.next.addEventListener('click', e => this.next.apply(this));
        this.controls.prev.addEventListener('click', e => this.prev.apply(this));
        this.controls.trace.addEventListener('change', e => this.audioSource.jump(e.target.value));

        "mousedown mousemove keydown".split(" ").forEach(eventName => {
            this.controls.volume.addEventListener(eventName,e => {
                this.volume = +e.target.value;
                this._lastVolumePoint = this.volume;
                this.triggerVolumeButton();
            },false);
        });

        document.addEventListener('mousedown', e => {
            if (e.target == this.controls.trace) this._isTraceTouched = true;
            setTimeout(() => {
                document.addEventListener('mouseup', e => this._isTraceTouched = false);
            },1500);

        });

        document.addEventListener('mousemove', e =>{
            this.show()
            clearTimeout(this._mouseTimeout);
            this._mouseTimeout = setTimeout(() => this.hide(), 6000);
        })
    }

    initPlayer(){
        this.audioSource.setVolume(this.volume);
        this.updateVolumeTrace();
        this.initEventHandlers();
        this.controls.playPause.click();
        this.setControlsActivity();
        this.show();

        this.setTimestamp();
        this.traceEndTime = this.audioSource.duration();
    }

    setAudioInput (source){
        Array.isArray(source) ? this._playlist = this._playlist.concat(source): this._playlist.push(source);
        this.setTrack(this._playlist.indexOf(Array.isArray(source) ? source[0] : source));
        this.initPlayer();
    }


    // Events
    onTrackChanges(handler){
        if(handler && {}.toString.call(handler) === '[object Function]'){
            this._listeners.push(Object.assign({eventName: 'trackChange', handler: handler}));
        }
    }

    triggerEvent(eventName){
        this._listeners.forEach(e => {
            if(e.eventName = eventName) e.handler.call(this.audioSource);
        })
    }
}