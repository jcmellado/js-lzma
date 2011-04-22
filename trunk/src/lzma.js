
var LZMA = LZMA || {};

LZMA.OutWindow = function(){
  var _buffer,
      _pos,
      _windowSize = 0,
      _streamPos,
      _stream;
      
  function create(windowSize){
    if ( (!_buffer) || (_windowSize !== windowSize) ){
      _buffer = [];
    }
    _windowSize = windowSize;
    _pos = 0;
    _streamPos = 0;
  }
  
  function flush(){
    var size = _pos - _streamPos, i = 0;
    if (size !== 0){
      for (; i < size; ++ i){
        _stream.writeByte(_buffer[_streamPos + i]);
      }
      if (_pos >= _windowSize){
        _pos = 0;
      }
      _streamPos = _pos;
    }
  }
  
  function releaseStream(){
    flush();
    _stream = null;
  }
  
  function setStream(stream){
    releaseStream();
    _stream = stream;
  }
  
  function init(solid){
    if (!solid){
      _streamPos = 0;
      _pos = 0;
    }
  }
  
  function copyBlock(distance, len){
    var pos = _pos - distance - 1;
    if (pos < 0){
      pos += _windowSize;
    }
    while(len --){
      if (pos >= _windowSize){
        pos = 0;
      }
      _buffer[_pos ++] = _buffer[pos ++];
      if (_pos >= _windowSize){
        flush();
      }
    }
  }
  
  function putByte(b){
    _buffer[_pos ++] = b;
    if (_pos >= _windowSize){
      flush();
    }
  }
  
  function getByte(distance){
    var pos = _pos - distance - 1;
    if (pos < 0){
      pos += _windowSize;
    }
    return _buffer[pos];
  }

  return{
    create: create,
    setStream: setStream,
    releaseStream: releaseStream,
    init: init,
    flush: flush,
    copyBlock: copyBlock,
    putByte: putByte,
    getByte: getByte
  };
};

LZMA.RangeDecoder = function(){
  var _range,
      _code,
      _stream;

  function setStream(stream){
    _stream = stream;
  }

  function releaseStream(){
    _stream = null;
  }
  
  function init(){
    var i = 5;

    _code = 0;
    _range = -1;
    
    while(i --){
      _code = (_code << 8) | _stream.readByte();
    }
  }
  
  function decodeDirectBits(numTotalBits){
    var result = 0, i = numTotalBits, t;
    
    while(i --){
      _range >>>= 1;
      t = (_code - _range) >>> 31;
      _code -= _range & (t - 1);
      result = (result << 1) | (1 - t);
      
      if ( (_range & 0xff000000) === 0){
        _code = (_code << 8) | _stream.readByte();
        _range <<= 8;
      }
    }
    
    return result;
  }
  
  function decodeBit(probs, index){
    var prob = probs[index],
        newBound = (_range >>> 11) * prob;
    
    if ( (_code ^ 0x80000000) < (newBound ^ 0x80000000) ){
      _range = newBound;
      probs[index] += (2048 - prob) >>> 5;
      if ( (_range & 0xff000000) === 0){
        _code = (_code << 8) | _stream.readByte();
        _range <<= 8;
      }
      return 0;
    }

    _range -= newBound;
    _code -= newBound;
    probs[index] -= prob >>> 5;
    if ( (_range & 0xff000000) === 0){
      _code = (_code << 8) | _stream.readByte();
      _range <<= 8;
    }
    return 1;
  }
  
  return{
    setStream: setStream,
    releaseStream: releaseStream,
    init: init,
    decodeDirectBits: decodeDirectBits,
    decodeBit: decodeBit
  };

};

LZMA.initBitModels =
  function(probs, len){
    while(len --){
      probs[len] = 1024;
    }
  };

LZMA.BitTreeDecoder = function(numBitLevels){
  var _models = [],
      _numBitLevels = numBitLevels;

  function init(){
    LZMA.initBitModels(_models, 1 << _numBitLevels);
  }

  function decode(rangeDecoder){
    var m = 1, i = _numBitLevels;

    while(i --){
      m = (m << 1) | rangeDecoder.decodeBit(_models, m);
    }
    return m - (1 << _numBitLevels);
  }

  function reverseDecode(rangeDecoder){
    var m = 1, symbol = 0, i = 0, bit;

    for (; i < _numBitLevels; ++ i){
      bit = rangeDecoder.decodeBit(_models, m);
      m = (m << 1) | bit;
      symbol |= bit << i;
    }
    return symbol;
  }

  return{
    init: init,
    decode: decode,
    reverseDecode: reverseDecode
  };
};

LZMA.reverseDecode2 = 
  function(models, startIndex, rangeDecoder, numBitLevels){
    var m = 1, symbol = 0, i = 0, bit;
    
    for (; i < numBitLevels; ++ i){
      bit = rangeDecoder.decodeBit(models, startIndex + m);
      m = (m << 1) | bit;
      symbol |= bit << i;
    }
    return symbol;
  };

LZMA.LenDecoder = function(){
  var _choice = [],
      _lowCoder = [],
      _midCoder = [],
      _highCoder = new LZMA.BitTreeDecoder(8),
      _numPosStates = 0;

  function create(numPosStates){
    for (; _numPosStates < numPosStates; ++ _numPosStates){
      _lowCoder[_numPosStates] = new LZMA.BitTreeDecoder(3);
      _midCoder[_numPosStates] = new LZMA.BitTreeDecoder(3);
    }
  }
  
  function init(){
    var i = _numPosStates;
    LZMA.initBitModels(_choice, 2);
    while(i --){
      _lowCoder[i].init();
      _midCoder[i].init();
    }
    _highCoder.init();
  }
  
  function decode(rangeDecoder, posState){
    if (rangeDecoder.decodeBit(_choice, 0) === 0){
      return _lowCoder[posState].decode(rangeDecoder);
    }
    if (rangeDecoder.decodeBit(_choice, 1) === 0){
      return 8 + _midCoder[posState].decode(rangeDecoder);
    }
    return 16 + _highCoder.decode(rangeDecoder);
  }

  return{
    create: create,
    init: init,
    decode: decode
  };
};

LZMA.Decoder2 = function(){
  var _decoders = [];
  
  function init(){
    LZMA.initBitModels(_decoders, 0x300);
  }

  function decodeNormal(rangeDecoder){
    var symbol = 1;

    do{
      symbol = (symbol << 1) | rangeDecoder.decodeBit(_decoders, symbol);
    }while(symbol < 0x100);

    return symbol & 0xff;
  }

  function decodeWithMatchByte(rangeDecoder, matchByte){
    var symbol = 1, matchBit, bit;
    
    do{
      matchBit = (matchByte >> 7) & 1;
      matchByte <<= 1;
      bit = rangeDecoder.decodeBit(_decoders, ( (1 + matchBit) << 8) + symbol);
      symbol = (symbol << 1) | bit;
      if (matchBit !== bit){
        while(symbol < 0x100){
          symbol = (symbol << 1) | rangeDecoder.decodeBit(_decoders, symbol);
        }
        break;
      }
    }while(symbol < 0x100);
    
    return symbol & 0xff;
  }
  
  return{
    init: init,
    decodeNormal: decodeNormal,
    decodeWithMatchByte: decodeWithMatchByte
  };
  
};
      
LZMA.LiteralDecoder = function(){
  var _coders,
      _numPrevBits,
      _numPosBits,
      _posMask;

  function create(numPosBits, numPrevBits){
    var i;
  
    if (_coders
      && (_numPrevBits === numPrevBits)
      && (_numPosBits === numPosBits) ){
      return;
    }
    _numPosBits = numPosBits;
    _posMask = (1 << numPosBits) - 1;
    _numPrevBits = numPrevBits;
    
    _coders = [];
    
    i = 1 << (_numPrevBits + _numPosBits);
    while(i --){
      _coders[i] = new LZMA.Decoder2();
    }
  }
  
  function init(){
    var i = 1 << (_numPrevBits + _numPosBits);
    while(i --){
      _coders[i].init();
    }
  }
  
  function getDecoder(pos, prevByte){
    return _coders[( (pos & _posMask) << _numPrevBits)
      + ( (prevByte & 0xff) >>> (8 - _numPrevBits) )];
  }

  return{
    create: create,
    init: init,
    getDecoder: getDecoder
  };
};

LZMA.Decoder = function(){
  var _outWindow = new LZMA.OutWindow(),
      _rangeDecoder = new LZMA.RangeDecoder(),
      _isMatchDecoders = [],
      _isRepDecoders = [],
      _isRepG0Decoders = [],
      _isRepG1Decoders = [],
      _isRepG2Decoders = [],
      _isRep0LongDecoders = [],
      _posSlotDecoder = [],
      _posDecoders = [],
      _posAlignDecoder = new LZMA.BitTreeDecoder(4),
      _lenDecoder = new LZMA.LenDecoder(),
      _repLenDecoder = new LZMA.LenDecoder(),
      _literalDecoder = new LZMA.LiteralDecoder(),
      _dictionarySize = -1,
      _dictionarySizeCheck = -1,
      _posStateMask,
      k = 4;

  while(k --){
    _posSlotDecoder[k] = new LZMA.BitTreeDecoder(6);
  }

  function setDictionarySize(dictionarySize){
    if (dictionarySize < 0){
      return false;
    }
    if (_dictionarySize !== dictionarySize){
      _dictionarySize = dictionarySize;
      _dictionarySizeCheck = Math.max(_dictionarySize, 1);
      _outWindow.create( Math.max(_dictionarySizeCheck, 4096) );
    }
    return true;
  }

  function setLcLpPb(lc, lp, pb){
    var numPosStates = 1 << pb;
    
    if (lc > 8 || lp > 4 || pb > 4){
      return false;
    }
    
    _literalDecoder.create(lp, lc);
    
    _lenDecoder.create(numPosStates);
    _repLenDecoder.create(numPosStates);
    _posStateMask = numPosStates - 1;
        
    return true;
  }

  function init(){
    var i = 4;
  
    _outWindow.init(false);
    
    LZMA.initBitModels(_isMatchDecoders, 192);
    LZMA.initBitModels(_isRep0LongDecoders, 192);
    LZMA.initBitModels(_isRepDecoders, 12);
    LZMA.initBitModels(_isRepG0Decoders, 12);
    LZMA.initBitModels(_isRepG1Decoders, 12);
    LZMA.initBitModels(_isRepG2Decoders, 12);
    LZMA.initBitModels(_posDecoders, 114);
    
    _literalDecoder.init();
    
    while(i --){
      _posSlotDecoder[i].init();
    }

    _lenDecoder.init();
    _repLenDecoder.init();
    _posAlignDecoder.init();
    _rangeDecoder.init();
  }

  function decode(inStream, outStream, outSize){
    var state = 0, rep0 = 0, rep1 = 0, rep2 = 0, rep3 = 0, nowPos64 = 0, prevByte = 0,
        posState, decoder2, len, distance, posSlot, numDirectBits;

    _rangeDecoder.setStream(inStream);
    _outWindow.setStream(outStream);
    
    init();

    while(outSize < 0 || nowPos64 < outSize){
      posState = nowPos64 & _posStateMask;
      
      if (_rangeDecoder.decodeBit(_isMatchDecoders, (state << 4) + posState) === 0){
        decoder2 = _literalDecoder.getDecoder(nowPos64 ++, prevByte);
        
        if (state >= 7){
          prevByte = decoder2.decodeWithMatchByte(_rangeDecoder, _outWindow.getByte(rep0) );
        }else{
          prevByte = decoder2.decodeNormal(_rangeDecoder);
        }
        _outWindow.putByte(prevByte);
        
        state = state < 4? 0: state - (state < 10? 3: 6);
        
      }else{
      
        if (_rangeDecoder.decodeBit(_isRepDecoders, state) === 1){
          len = 0;
          if (_rangeDecoder.decodeBit(_isRepG0Decoders, state) === 0){
            if (_rangeDecoder.decodeBit(_isRep0LongDecoders, (state << 4) + posState) === 0){
              state = state < 7? 9: 11;
              len = 1;
            }
          }else{
            if (_rangeDecoder.decodeBit(_isRepG1Decoders, state) === 0){
              distance = rep1;
            }else{
              if (_rangeDecoder.decodeBit(_isRepG2Decoders, state) === 0){
                distance = rep2;
              }else{
                distance = rep3;
                rep3 = rep2;
              }
              rep2 = rep1;
            }
            rep1 = rep0;
            rep0 = distance;
          }
          if (len === 0){
            len = _repLenDecoder.decode(_rangeDecoder, posState) + 2;
            state = state < 7? 8: 11;
          }
        }else{
          rep3 = rep2;
          rep2 = rep1;
          rep1 = rep0;
          
          len = 2 + _lenDecoder.decode(_rangeDecoder, posState);
          state = state < 7? 7: 10;
          
          posSlot = _posSlotDecoder[len <= 5? len - 2: 3].decode(_rangeDecoder);
          if (posSlot >= 4){
          
            numDirectBits = (posSlot >> 1) - 1;
            rep0 = (2 | (posSlot & 1) ) << numDirectBits;
            
            if (posSlot < 14){
              rep0 += LZMA.reverseDecode2(_posDecoders,
                  rep0 - posSlot - 1, _rangeDecoder, numDirectBits);
            }else{
              rep0 += _rangeDecoder.decodeDirectBits(numDirectBits - 4) << 4;
              rep0 += _posAlignDecoder.reverseDecode(_rangeDecoder);
              if (rep0 < 0){
                if (rep0 === -1){
                  break;
                }
                return false;
              }
            }
          }else{
            rep0 = posSlot;
          }
        }

        if (rep0 >= nowPos64 || rep0 >= _dictionarySizeCheck){
          return false;
        }

        _outWindow.copyBlock(rep0, len);
        nowPos64 += len;
        prevByte = _outWindow.getByte(0);
      }
    }
    
    _outWindow.flush();
    _outWindow.releaseStream();
    _rangeDecoder.releaseStream();
    
    return true;
  }

  function setDecoderProperties(properties){
    var value, lc, lp, pb, dictionarySize;
  
    if (properties.size < 5){
      return false;
    }

    value = properties.readByte();
    lc = value % 9;
    value = ~~(value / 9);
    lp = value % 5;
    pb = ~~(value / 5);
    
    if ( !setLcLpPb(lc, lp, pb) ){
      return false;
    }

    dictionarySize = properties.readByte();
    dictionarySize |= properties.readByte() << 8;
    dictionarySize |= properties.readByte() << 16;
    dictionarySize += properties.readByte() * 16777216;
      
    return setDictionarySize(dictionarySize);
  }

  return{
    decode: decode,
    setDecoderProperties: setDecoderProperties
  };
};

LZMA.decompress = function(properties, inStream, outStream, outSize){
  var decoder = new LZMA.Decoder();

  if ( !decoder.setDecoderProperties(properties) ){
    throw "Incorrect stream properties";
  }
  
  if ( !decoder.decode(inStream, outStream, outSize) ){
    throw "Error in data stream";
  }
  
  return true;
};
