const fs = require('fs');
const Blowfish = require('egoroof-blowfish');

const filePath = './songs/badguy.mp3';
const file = fs.readFileSync(filePath);

                        // encryption methods //
// ****************************************************************************** //
                        // swipe between two bytes values

const enByShiftingBytes = (byte) => {
    if (byte === 70) {
        byte >>= 1;
    } else if (byte === 35) {
        byte <<= 1;
    } else if (byte === 254) {
        byte >>= 1;
    } else if (byte === 127) {
        byte <<= 1;
    }
    return byte;
}

let enFileDist = new Buffer.alloc(file.byteLength);
let enFilePath = './songs/badguy-en-bytes-shift.mp3';

file.forEach((b, index) => {
    const byte = enByShiftingBytes(b);
    enFileDist.writeUInt8(byte, index);
});

fs.writeFileSync(enFilePath, enFileDist);
// ****************************************************************************** //


// ****************************************************************************** //
                    // increase every 512 byte by 1 (buggy)

const enByIncreasingEvery512By1 = (byte, index) => {
    if (index % 512 === 0) {
        if (byte <= 254 && byte >= 0) {
            byte += 1;
        }
    }
    return byte;
}

enFileDist = new Buffer.alloc(file.byteLength);
enFilePath = './songs/badguy-en-bytes-increasing.mp3';

file.forEach((b, index) => {
    const byte = enByIncreasingEvery512By1(b, index);
    enFileDist.writeUInt8(byte, index);
});

fs.writeFileSync(enFilePath, enFileDist);
// ****************************************************************************** //


// ****************************************************************************** //
       // encrypt every third 2048 byte block with bluefish (Deezer style)  //

const key = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ];
const bf = new Blowfish(new Buffer(key));
let i = 0;

const enChunkByBFEveryThird2048WithKey = (chunk) => {
    if (i !== 0 && i % 3 === 0) {
        chunk = bf.encode(chunk);
    }
    i++;
    return chunk;
}
// helper method to write a chunk of bytes into a buffer //
const writeBuffer = (buffer, chunk, index) => {
    chunk.forEach((b, ind) => {
        buffer.writeUInt8(b, ind + index);
    });
}

enFileDist = new Buffer.alloc(file.byteLength);
enFilePath = './songs/badguy-en-blowfish.mp3';
let tempBuffer = new Buffer.alloc(2048); // to store every 2048 bytes
let ind = 0;

file.forEach((b, index) => {
    if (index !== 0 && index % 2048 === 0) {
        writeBuffer(enFileDist, enChunkByBFEveryThird2048WithKey(tempBuffer), index - 2048);
        tempBuffer = new Buffer.alloc(2048);
        ind = 0;
    }
    tempBuffer.writeUInt8(b, ind++);
});

fs.writeFileSync(enFilePath, enFileDist);
// ****************************************************************************** //

console.log(`encryption finished.`);
