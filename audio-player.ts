declare var Blowfish: any;

class AudioPlayer {
    public audioElement: HTMLAudioElement | null = null;
    private mediaSource: MediaSource | null = null;
    private sourceBuffer: SourceBuffer | null = null;
    private duration: number | null = null;
    private downloadedDuration: number | null = null;
    private objectUrl: string | null = null;
    private needsFlush: boolean = false;
    private needsEos: boolean = false;
    private appending: boolean = false;
    private segmentBufferSize: number = 2 * 1024;
    private segments: Uint8Array[] = [];
    // counters
    private appended: number = 0;
    private appendError: number = 0;
    private flushBufferCounter: number = 0;
    private audioUrl: string;
    private eventListeners: {} = {};
    public dencryptionMethod: (semgent: Uint8Array, index: number) => Uint8Array;
    // fetch
    private fetching: boolean = false;
    private currentFetchBody: ReadableStream<Uint8Array> | null = null;

    constructor(audioUrl: string, dencryptionMethod) {
        this.audioUrl = audioUrl;
        this.dencryptionMethod = dencryptionMethod;
        this.init();
    }
    public on(eventName: string, cb: () => any) {
        this.eventListeners[eventName] = this.eventListeners[eventName] ? [...this.eventListeners[eventName], cb] : [cb];
    }

    private emit(eventName: string) {
        const listeners = this.eventListeners[eventName];
        if (!listeners) return;
        listeners.forEach(cb => {
            cb();
        });
    }

    private init() {
        console.log('--> init');
        this.initAudioElement();
        this.initMediaSource();
        this.attachMSEvents();
        this.attachMediaSource();
    }

    private initAudioElement() {
        console.log('--> init audioElement');
        this.audioElement = document.createElement('audio');
        this.audioElement.controls = true;
        setTimeout(() => this.emit('create-audioelement'), 100);
    };

    private initMediaSource() {
        console.log('--> init mediaSource');
        this.mediaSource = new MediaSource();
    }

    private attachMediaSource() {
        const ms = this.mediaSource;
        let ae = this.audioElement;
        if (!ae) {
            this.initAudioElement();
        }
        const objectUrl = this.objectUrl = window.URL.createObjectURL(ms);
        this.audioElement.src = objectUrl;
        console.log('--> attached mediaSource');
    }

    private attachMSEvents() {
        const ms = this.mediaSource;
        ms.addEventListener('sourceopen', this.msSourceOpen);
        ms.addEventListener('sourceended', this.msSourceEnded);
        ms.addEventListener('sourceclose', this.msSourceClose);
        console.log('--> attached mediaSource events');
    }

    private attachSBEvents() {
        const sb = this.sourceBuffer;
        sb.addEventListener('updatestart', this.sbUpdateStart);
        sb.addEventListener('updateend', this.sbUpdateEnded);
        sb.addEventListener('error', this.sbError);
        console.log('--> attached sourceBuffer events');
    }

    private msSourceOpen = () => {
        console.log('--> mediaSource open');
        // remove the event from the listener
        this.mediaSource.removeEventListener('sourceopen', this.msSourceOpen);
        // check pending segments
        this.checkPendingSegments();
    }

    private msSourceEnded = () => {
        console.log('-> mediaSource sourceended');
    }
    private msSourceClose = () => {
        console.log('-> mediaSource close');
    }

    private sbUpdateStart = () => {
        // console.log('--> sourceBuffer updatestart');
        this.appending = true;
    }
    private sbUpdateEnded = () => {
        // console.log('--> sourceBuffer updateended');
        this.appended += 1;
        this.appending = false;
        this.doAppend();
    }
    private sbError = () => {
        console.warn('--> sourceBuffer error');
    }

    private checkPendingSegments() {
        // check if there is any SB
        let sb = this.sourceBuffer;
        if (!sb && this.mediaSource.readyState === 'open') {
            sb = this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');
            this.attachSBEvents();
        }
        this.doAppend();
    }

    private doAppend() {
        const sb = this.sourceBuffer;
        if (this.appending || sb.updating) {
            return;
        }
        const segment = this.segments.shift();

        if (this.needsEos && !segment) {
            this.mediaSource.endOfStream();
        }

        if (!segment) {
            return;
        }
        this.sourceBuffer.appendBuffer(segment.slice(0));
    }

    private fetchDataAndPushSegments() {
        console.log('--> fetch start');
        // TODO: add more header configs like byte-range
        fetch(this.audioUrl)
            .then(res => {
                console.log('--> fetch responded');
                console.log('--> fetch content-length = ' + res.headers.get('content-length'));
                this.currentFetchBody = res.body;
                this.streamToSegments();
            });
    }

    private async streamToSegments() {
        console.log('--> streamToSegments start');

        const body = this.currentFetchBody;
        if (!body) {
            console.warn('--> WTF!, streamToSegments called with falsy currentFetchBody?');
            return;
        }

        const reader = body.getReader();
        let index = 0;

        // TODO: create a smart way to handle the incaming stream
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            let readPos = 0;
            let semgentBuffer = new Uint8Array(this.segmentBufferSize)

            for (let byte of value) {
                semgentBuffer[readPos++] = byte;
                if (readPos === this.segmentBufferSize) {

                    // Dencryption part //
                    // send every 2048 sized segment to the dencryption function
                    const deSegment = this.dencryptionMethod(semgentBuffer, index);

                    this.segments.push(deSegment);
                    semgentBuffer = new Uint8Array(this.segmentBufferSize);
                    readPos = 0;
                    this.checkPendingSegments();
                }
                index++;
            }
        }

        reader.closed.then(() => {
            this.needsEos = true;
        });
    }

    private cancelDownload() {
        const body = this.currentFetchBody;
        if (body) {
            body.cancel();
        }
    }

    public load() {
        console.log('--> start loading');
        this.fetchDataAndPushSegments();
    };

    public play() {

    }
}


// ****************************************************************************** //
const deByShiftingBytes = (chunk: Uint8Array) => {
    const deChunk = new Uint8Array(chunk.byteLength);
    chunk.forEach((byte, index) => {
        if (byte === 70) {
            byte >>= 1;
        } else if (byte === 35) {
            byte <<= 1;
        } else if (byte === 254) {
            byte >>= 1;
        } else if (byte === 127) {
            byte <<= 1;
        }
        deChunk[index] = byte;
    });
    return deChunk;
}
const shiftingPlayer = new AudioPlayer('songs/badguy-en-bytes-shift.mp3', deByShiftingBytes);
shiftingPlayer.load();
shiftingPlayer.on('create-audioelement', () => {
    document.getElementById('shift-bytes-player-container').append(shiftingPlayer.audioElement);
});
// ****************************************************************************** //

// ****************************************************************************** //
var key = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const bf = new Blowfish(new Uint8Array(key));
let i = 0;
const deByBFEvery2048WithKey = (chunk: Uint8Array) => {
    if (i !== 0 && i % 3 === 0) {
        chunk = bf.decode(chunk, Blowfish.TYPE.UINT8_ARRAY);
    }
    i++;
    return chunk;
}
const blowfishPlayer = new AudioPlayer('songs/badguy-en-blowfish.mp3', deByBFEvery2048WithKey);
blowfishPlayer.load();
blowfishPlayer.on('create-audioelement', () => {
    document.getElementById('blowfish-player-container').append(blowfishPlayer.audioElement);
});
// ****************************************************************************** //

// ****************************************************************************** //
const deByDecreasingEvery512By1 = (chunk: Uint8Array) => {
    const deChunk = new Uint8Array(chunk.byteLength);
    chunk.forEach((byte, index) => {
        if (index % 512 === 0) {
            if (byte <= 254 && byte >= 0) {
                byte -= 1;
            }
        }
        deChunk[index] = byte;
    });
    return deChunk;
}
const increaseingPlayer = new AudioPlayer('songs/badguy-en-bytes-increasing.mp3', deByDecreasingEvery512By1);
increaseingPlayer.load();
increaseingPlayer.on('create-audioelement', () => {
    document.getElementById('increasing-player-container').append(increaseingPlayer.audioElement);
});
// ****************************************************************************** //
