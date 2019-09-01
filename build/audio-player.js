var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var AudioPlayer = /** @class */ (function () {
    function AudioPlayer(audioUrl, dencryptionMethod) {
        var _this = this;
        this.audioElement = null;
        this.mediaSource = null;
        this.sourceBuffer = null;
        this.duration = null;
        this.downloadedDuration = null;
        this.objectUrl = null;
        this.needsFlush = false;
        this.needsEos = false;
        this.appending = false;
        this.segmentBufferSize = 2 * 1024;
        this.segments = [];
        // counters
        this.appended = 0;
        this.appendError = 0;
        this.flushBufferCounter = 0;
        this.eventListeners = {};
        // fetch
        this.fetching = false;
        this.currentFetchBody = null;
        this.msSourceOpen = function () {
            console.log('--> mediaSource open');
            // remove the event from the listener
            _this.mediaSource.removeEventListener('sourceopen', _this.msSourceOpen);
            // check pending segments
            _this.checkPendingSegments();
        };
        this.msSourceEnded = function () {
            console.log('-> mediaSource sourceended');
        };
        this.msSourceClose = function () {
            console.log('-> mediaSource close');
        };
        this.sbUpdateStart = function () {
            // console.log('--> sourceBuffer updatestart');
            _this.appending = true;
        };
        this.sbUpdateEnded = function () {
            // console.log('--> sourceBuffer updateended');
            _this.appended += 1;
            _this.appending = false;
            _this.doAppend();
        };
        this.sbError = function () {
            console.warn('--> sourceBuffer error');
        };
        this.audioUrl = audioUrl;
        this.dencryptionMethod = dencryptionMethod;
        this.init();
    }
    AudioPlayer.prototype.on = function (eventName, cb) {
        this.eventListeners[eventName] = this.eventListeners[eventName] ? __spread(this.eventListeners[eventName], [cb]) : [cb];
    };
    AudioPlayer.prototype.emit = function (eventName) {
        var listeners = this.eventListeners[eventName];
        if (!listeners)
            return;
        listeners.forEach(function (cb) {
            cb();
        });
    };
    AudioPlayer.prototype.init = function () {
        console.log('--> init');
        this.initAudioElement();
        this.initMediaSource();
        this.attachMSEvents();
        this.attachMediaSource();
    };
    AudioPlayer.prototype.initAudioElement = function () {
        var _this = this;
        console.log('--> init audioElement');
        this.audioElement = document.createElement('audio');
        this.audioElement.controls = true;
        setTimeout(function () { return _this.emit('create-audioelement'); }, 100);
    };
    ;
    AudioPlayer.prototype.initMediaSource = function () {
        console.log('--> init mediaSource');
        this.mediaSource = new MediaSource();
    };
    AudioPlayer.prototype.attachMediaSource = function () {
        var ms = this.mediaSource;
        var ae = this.audioElement;
        if (!ae) {
            this.initAudioElement();
        }
        var objectUrl = this.objectUrl = window.URL.createObjectURL(ms);
        this.audioElement.src = objectUrl;
        console.log('--> attached mediaSource');
    };
    AudioPlayer.prototype.attachMSEvents = function () {
        var ms = this.mediaSource;
        ms.addEventListener('sourceopen', this.msSourceOpen);
        ms.addEventListener('sourceended', this.msSourceEnded);
        ms.addEventListener('sourceclose', this.msSourceClose);
        console.log('--> attached mediaSource events');
    };
    AudioPlayer.prototype.attachSBEvents = function () {
        var sb = this.sourceBuffer;
        sb.addEventListener('updatestart', this.sbUpdateStart);
        sb.addEventListener('updateend', this.sbUpdateEnded);
        sb.addEventListener('error', this.sbError);
        console.log('--> attached sourceBuffer events');
    };
    AudioPlayer.prototype.checkPendingSegments = function () {
        // check if there is any SB
        var sb = this.sourceBuffer;
        if (!sb && this.mediaSource.readyState === 'open') {
            sb = this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');
            this.attachSBEvents();
        }
        this.doAppend();
    };
    AudioPlayer.prototype.doAppend = function () {
        var sb = this.sourceBuffer;
        if (this.appending || sb.updating) {
            return;
        }
        var segment = this.segments.shift();
        if (this.needsEos && !segment) {
            this.mediaSource.endOfStream();
        }
        if (!segment) {
            return;
        }
        this.sourceBuffer.appendBuffer(segment.slice(0));
    };
    AudioPlayer.prototype.fetchDataAndPushSegments = function () {
        var _this = this;
        console.log('--> fetch start');
        // TODO: add more header configs like byte-range
        fetch(this.audioUrl)
            .then(function (res) {
            console.log('--> fetch responded');
            console.log('--> fetch content-length = ' + res.headers.get('content-length'));
            _this.currentFetchBody = res.body;
            _this.streamToSegments();
        });
    };
    AudioPlayer.prototype.streamToSegments = function () {
        return __awaiter(this, void 0, void 0, function () {
            var body, reader, index, _a, value, done, readPos, semgentBuffer, value_1, value_1_1, byte, deSegment;
            var e_1, _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log('--> streamToSegments start');
                        body = this.currentFetchBody;
                        if (!body) {
                            console.warn('--> WTF!, streamToSegments called with falsy currentFetchBody?');
                            return [2 /*return*/];
                        }
                        reader = body.getReader();
                        index = 0;
                        _c.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 3];
                        return [4 /*yield*/, reader.read()];
                    case 2:
                        _a = _c.sent(), value = _a.value, done = _a.done;
                        if (done)
                            return [3 /*break*/, 3];
                        readPos = 0;
                        semgentBuffer = new Uint8Array(this.segmentBufferSize);
                        try {
                            for (value_1 = (e_1 = void 0, __values(value)), value_1_1 = value_1.next(); !value_1_1.done; value_1_1 = value_1.next()) {
                                byte = value_1_1.value;
                                semgentBuffer[readPos++] = byte;
                                if (readPos === this.segmentBufferSize) {
                                    deSegment = this.dencryptionMethod(semgentBuffer, index);
                                    this.segments.push(deSegment);
                                    semgentBuffer = new Uint8Array(this.segmentBufferSize);
                                    readPos = 0;
                                    this.checkPendingSegments();
                                }
                                index++;
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (value_1_1 && !value_1_1.done && (_b = value_1["return"])) _b.call(value_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [3 /*break*/, 1];
                    case 3:
                        reader.closed.then(function () {
                            _this.needsEos = true;
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    AudioPlayer.prototype.cancelDownload = function () {
        var body = this.currentFetchBody;
        if (body) {
            body.cancel();
        }
    };
    AudioPlayer.prototype.load = function () {
        console.log('--> start loading');
        this.fetchDataAndPushSegments();
    };
    ;
    AudioPlayer.prototype.play = function () {
    };
    return AudioPlayer;
}());
// ****************************************************************************** //
var deByShiftingBytes = function (chunk) {
    var deChunk = new Uint8Array(chunk.byteLength);
    chunk.forEach(function (byte, index) {
        if (byte === 70) {
            byte >>= 1;
        }
        else if (byte === 35) {
            byte <<= 1;
        }
        else if (byte === 254) {
            byte >>= 1;
        }
        else if (byte === 127) {
            byte <<= 1;
        }
        deChunk[index] = byte;
    });
    return deChunk;
};
var shiftingPlayer = new AudioPlayer('songs/badguy-en-bytes-shift.mp3', deByShiftingBytes);
shiftingPlayer.load();
shiftingPlayer.on('create-audioelement', function () {
    document.getElementById('shift-bytes-player-container').append(shiftingPlayer.audioElement);
});
// ****************************************************************************** //
// ****************************************************************************** //
var key = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
var bf = new Blowfish(new Uint8Array(key));
var i = 0;
var deByBFEvery2048WithKey = function (chunk) {
    if (i !== 0 && i % 3 === 0) {
        chunk = bf.decode(chunk, Blowfish.TYPE.UINT8_ARRAY);
    }
    i++;
    return chunk;
};
var blowfishPlayer = new AudioPlayer('songs/badguy-en-blowfish.mp3', deByBFEvery2048WithKey);
blowfishPlayer.load();
blowfishPlayer.on('create-audioelement', function () {
    document.getElementById('blowfish-player-container').append(blowfishPlayer.audioElement);
});
// ****************************************************************************** //
// ****************************************************************************** //
var deByDecreasingEvery512By1 = function (chunk) {
    var deChunk = new Uint8Array(chunk.byteLength);
    chunk.forEach(function (byte, index) {
        if (index % 512 === 0) {
            if (byte <= 254 && byte >= 0) {
                byte -= 1;
            }
        }
        deChunk[index] = byte;
    });
    return deChunk;
};
var increaseingPlayer = new AudioPlayer('songs/badguy-en-bytes-increasing.mp3', deByDecreasingEvery512By1);
increaseingPlayer.load();
increaseingPlayer.on('create-audioelement', function () {
    document.getElementById('increasing-player-container').append(increaseingPlayer.audioElement);
});
// ****************************************************************************** //
//# sourceMappingURL=audio-player.js.map