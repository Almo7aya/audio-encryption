# Deezer encryption research

List of stuff found about Deezer and how do they encrypt and decrypt their songs.

## Overview

In general Deezer doesn't encrypt the whole song file, They only encrypt every third `2048` byte block with [BlowFish](https://en.wikipedia.org/wiki/Blowfish_(cipher)) encrption algorithm.

The `BlowFish` algorithm is [Symmetric-key algorithm](https://en.wikipedia.org/wiki/Symmetric-key_algorithm) so it requires a key to be decrypted, So Deezer generate the key in very straightforward they combine the `SNG_ID` which retrieved from the APIs with the song response with their secret key and a lot of md5 staff, thanks to [Deezpy](https://notabug.org/deezpy-dev/Deezpy).

```python
def getBlowfishKey(trackId):
    '''Calculates the Blowfish decrypt key for a given SNG_ID.'''
    secret = 'g4el58wc0zvf9na1'
    m = hashlib.md5()
    m.update(bytes([ord(x) for x in trackId]))
    idMd5 = m.hexdigest()
    bfKey = bytes(([(ord(idMd5[i]) ^ ord(idMd5[i+16]) ^ ord(secret[i]))
                  for i in range(16)]))
    return bfKey
```

### Sources

- [Deezpy](https://notabug.org/deezpy-dev/Deezpy) Deezer downloader with rich featrues.

- [Deezer official player code](https://cdns-files.dzcdn.net/cache/js/player-HTML5Renderer.b9e95adbc9aaef2c471c.js) Contains a lot of useful information about how did they implement the equalizing featrue and more. _needs more studing_
