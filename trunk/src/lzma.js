
var LZMA = LZMA || {};

LZMA.Base = (function(){

  var k = {};

  k.NumRepDistances = 4;
  k.NumStates = 12;

  k.NumPosSlotBits = 6;
  k.DicLogSizeMin = 0;

  k.NumLenToPosStatesBits = 2;
  k.NumLenToPosStates = 1 << k.NumLenToPosStatesBits;

  k.MatchMinLen = 2;

  k.NumAlignBits = 4;
  k.AlignTableSize = 1 << k.NumAlignBits;
  k.AlignMask = k.AlignTableSize - 1;

  k.StartPosModelIndex = 4;
  k.EndPosModelIndex = 14;
  k.NumPosModels = k.EndPosModelIndex - k.StartPosModelIndex;

  k.NumFullDistances = 1 << (k.EndPosModelIndex / 2);

  k.NumLitPosStatesBitsEncodingMax = 4;
  k.NumLitContextBitsMax = 8;

  k.NumPosStatesBitsMax = 4;
  k.NumPosStatesMax = 1 << k.NumPosStatesBitsMax;
  k.NumPosStatesBitsEncodingMax = 4;
  k.NumPosStatesEncodingMax = 1 << k.NumPosStatesBitsEncodingMax;

  k.NumLowLenBits = 3;
  k.NumMidLenBits = 3;
  k.NumHighLenBits = 8;
  k.NumLowLenSymbols = 1 << k.NumLowLenBits;
  k.NumMidLenSymbols = 1 << k.NumMidLenBits;
  k.NumLenSymbols = k.NumLowLenSymbols + k.NumMidLenSymbols
    + (1 << k.NumHighLenBits);
  k.MatchMaxLen = k.MatchMinLen + k.NumLenSymbols - 1;

  k.TopMask = ~( (1 << 24) - 1);
  k.NumBitModelTotalBits = 11;
  k.BitModelTotal = 1 << k.NumBitModelTotalBits;
  k.NumMoveBits = 5;

  return {
    k: k,
    
    stateInit: function(){
      return 0;
    },

    stateUpdateChar: function(index){
      if (index < 4) {
        return 0;
      }
      if (index < 10) {
        return index - 3;
      }
      return index - 6;
    },

    stateUpdateMatch: function(index){
      return index < 7? 7: 10; 
    },

    stateUpdateRep: function(index){
      return index < 7? 8: 11; 
    },

    stateUpdateShortRep: function(index){
      return index < 7? 9: 11; 
    },

    stateIsCharState: function(index){ 
      return index < 7; 
    },

    getLenToPosState: function(len){
      len -= k.MatchMinLen;
      if (len < k.NumLenToPosStates){
        return len;
      }
      return k.NumLenToPosStates - 1;
    }
  
  };

}());

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
  
  function setStream(stream){
    releaseStream();
    _stream = stream;
  }
  
  function releaseStream(){
    flush();
    _stream = null;
  }
  
  function init(solid){
    if (!solid){
      _streamPos = 0;
      _pos = 0;
    }
  }
  
  function flush(){
    var size = _pos - _streamPos;
    if (size === 0){
      return;
    }
    for (var i = 0; i < size; ++ i){
      _stream.writeByte(_buffer[_streamPos + i]);
    }
    if (_pos >= _windowSize){
      _pos = 0;
    }
    _streamPos = _pos;
  }
  
  function copyBlock(distance, len){
    var pos = _pos - distance - 1;
    if (pos < 0){
      pos += _windowSize;
    }
    for (; len !== 0; -- len){
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
    _code = 0;
    _range = -1;
    
    for (var i = 0; i < 5; ++ i){
      _code = (_code << 8) | _stream.readByte();
    }
  }
  
  function decodeDirectBits(numTotalBits){
    var result = 0,
        i = numTotalBits;
    
    for (; i !== 0; --i){
      _range >>>= 1;
      var t = (_code - _range) >>> 31;
      _code -= _range & (t - 1);
      result = (result << 1) | (1 - t);
      
      if ( (_range & LZMA.Base.k.TopMask) === 0){
        _code = (_code << 8) | _stream.readByte();
        _range <<= 8;
      }
    }
    
    return result;
  }
  
  function decodeBit(probs, index){
    var prob = probs[index],
        newBound = (_range >>> LZMA.Base.k.NumBitModelTotalBits) * prob;
    
    if ( (_code ^ 0x80000000) < (newBound ^ 0x80000000) ){
      _range = newBound;
      probs[index] = prob + ( (LZMA.Base.k.BitModelTotal - prob) >>> LZMA.Base.k.NumMoveBits);
      if ( (_range & LZMA.Base.k.TopMask) === 0){
        _code = (_code << 8) | _stream.readByte();
        _range <<= 8;
      }
      return 0;
    }

    _range -= newBound;
    _code -= newBound;
    probs[index] = prob - (prob >>> LZMA.Base.k.NumMoveBits);
    if ( (_range & LZMA.Base.k.TopMask) === 0){
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

LZMA.RangeDecoder.initBitModels =
  function(probs){
    for (var i = 0; i < probs.length; ++ i){
      probs[i] = LZMA.Base.k.BitModelTotal >>> 1;
    }
  };

LZMA.BitTreeDecoder = function(numBitLevels){
  var _models = new Array(1 << numBitLevels),
      _numBitLevels = numBitLevels;

  function init(){
    LZMA.RangeDecoder.initBitModels(_models);
  }

  function decode(rangeDecoder){
    var m = 1,
        bitIndex = _numBitLevels;
    for (; bitIndex !== 0; -- bitIndex){
      m = (m << 1) + rangeDecoder.decodeBit(_models, m);
    }
    return m - (1 << _numBitLevels);
  }

  function reverseDecode(rangeDecoder){
    var m = 1,
        symbol = 0,
        bitIndex = 0;
    for (; bitIndex < _numBitLevels; ++ bitIndex){
      var bit = rangeDecoder.decodeBit(_models, m);
      m <<= 1;
      m += bit;
      symbol |= bit << bitIndex;
    }
    return symbol;
  }

  return{
    init: init,
    decode: decode,
    reverseDecode: reverseDecode
  };
};

LZMA.BitTreeDecoder.reverseDecode2 = 
  function(models, startIndex, rangeDecoder, numBitLevels){
    var m = 1,
        symbol = 0,
        bitIndex = 0;
    for (; bitIndex < numBitLevels; ++ bitIndex){
      var bit = rangeDecoder.decodeBit(models, startIndex + m);
      m <<= 1;
      m += bit;
      symbol |= bit << bitIndex;
    }
    return symbol;
  };

LZMA.LenDecoder = function(){
  var _choice = new Array(2),
      _lowCoder = new Array(LZMA.Base.k.NumPosStatesMax),
      _midCoder = new Array(LZMA.Base.k.NumPosStatesMax),
      _highCoder = new LZMA.BitTreeDecoder(LZMA.Base.k.NumHighLenBits),
      _numPosStates = 0;

  function create(numPosStates){
    for (; _numPosStates < numPosStates; ++ _numPosStates){
      _lowCoder[_numPosStates] = new LZMA.BitTreeDecoder(LZMA.Base.k.NumLowLenBits);
      _midCoder[_numPosStates] = new LZMA.BitTreeDecoder(LZMA.Base.k.NumMidLenBits);
    }
  }
  
  function init(){
    var posState = 0;
    LZMA.RangeDecoder.initBitModels(_choice);
    for (; posState < _numPosStates; ++ posState){
      _lowCoder[posState].init();
      _midCoder[posState].init();
    }
    _highCoder.init();
  }
  
  function decode(rangeDecoder, posState){
    if ( rangeDecoder.decodeBit(_choice, 0) === 0){
      return _lowCoder[posState].decode(rangeDecoder);
    }
    var symbol = LZMA.Base.k.NumLowLenSymbols;
    if (rangeDecoder.decodeBit(_choice, 1) === 0){
      symbol += _midCoder[posState].decode(rangeDecoder);
    }else{
      symbol += LZMA.Base.k.NumMidLenSymbols + _highCoder.decode(rangeDecoder);
    }
    return symbol;
  }

  return{
    create: create,
    init: init,
    decode: decode
  };
};

LZMA.Decoder2 = function(){
  var _decoders = new Array(0x300);
  
  function init(){
    LZMA.RangeDecoder.initBitModels(_decoders);
  }

  function decodeNormal(rangeDecoder){
    var symbol = 1;

    do{
      symbol = (symbol << 1) | rangeDecoder.decodeBit(_decoders, symbol);
    }while(symbol < 0x100);

    return symbol & 0xff;
  }

  function decodeWithMatchByte(rangeDecoder, matchByte){
    var symbol = 1;
    
    do{
      var matchBit = (matchByte >> 7) & 1;
      matchByte <<= 1;
      var bit = rangeDecoder.decodeBit(_decoders, ( (1 + matchBit) << 8) + symbol);
      symbol = (symbol << 1) | bit;
      if (matchBit !== bit){
        while (symbol < 0x100){
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
    if (_coders
      && (_numPrevBits === numPrevBits)
      && (_numPosBits === numPosBits) ){
      return;
    }
    _numPosBits = numPosBits;
    _posMask = (1 << numPosBits) - 1;
    _numPrevBits = numPrevBits;
    
    var numStates = 1 << (_numPrevBits + _numPosBits);
    
    _coders = new Array(numStates);
    
    for (var i = 0; i < numStates; ++ i){
      _coders[i] = new LZMA.Decoder2();
    }
  }
  
  function init(){
    var numStates = 1 << (_numPrevBits + _numPosBits);
    for (var i = 0; i < numStates; ++ i){
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
      _isMatchDecoders = new Array(LZMA.Base.k.NumStates << LZMA.Base.k.NumPosStatesBitsMax),
      _isRepDecoders = new Array(LZMA.Base.k.NumStates),
      _isRepG0Decoders = new Array(LZMA.Base.k.NumStates),
      _isRepG1Decoders = new Array(LZMA.Base.k.NumStates),
      _isRepG2Decoders = new Array(LZMA.Base.k.NumStates),
      _isRep0LongDecoders = new Array(LZMA.Base.k.NumStates << LZMA.Base.k.NumPosStatesBitsMax),
      _posSlotDecoder = new Array(LZMA.Base.k.NumLenToPosStates),
      _posDecoders = new Array(LZMA.Base.k.NumFullDistances - LZMA.Base.k.EndPosModelIndex),
      _posAlignDecoder = new LZMA.BitTreeDecoder(LZMA.Base.k.NumAlignBits),
      _lenDecoder = new LZMA.LenDecoder(),
      _repLenDecoder = new LZMA.LenDecoder(),
      _literalDecoder = new LZMA.LiteralDecoder(),
      _dictionarySize = -1,
      _dictionarySizeCheck = -1,
      _posStateMask;

  for (var i = 0; i < LZMA.Base.k.NumLenToPosStates; ++ i){
    _posSlotDecoder[i] =
      new LZMA.BitTreeDecoder(LZMA.Base.k.NumPosSlotBits);
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
    if (lc > LZMA.Base.k.NumLitContextBitsMax
      || lp > 4
      || pb > LZMA.Base.k.NumPosStatesBitsMax){
      return false;
    }
    
    _literalDecoder.create(lp, lc);
    var numPosStates = 1 << pb;
    _lenDecoder.create(numPosStates);
    _repLenDecoder.create(numPosStates);
    _posStateMask = numPosStates - 1;
        
    return true;
  }

  function init(){
    _outWindow.init(false);
    
    LZMA.RangeDecoder.initBitModels(_isMatchDecoders);
    LZMA.RangeDecoder.initBitModels(_isRep0LongDecoders);
    LZMA.RangeDecoder.initBitModels(_isRepDecoders);
    LZMA.RangeDecoder.initBitModels(_isRepG0Decoders);
    LZMA.RangeDecoder.initBitModels(_isRepG1Decoders);
    LZMA.RangeDecoder.initBitModels(_isRepG2Decoders);
    LZMA.RangeDecoder.initBitModels(_posDecoders);
    
    _literalDecoder.init();
    
    for (var i = 0; i < LZMA.Base.k.NumLenToPosStates; ++ i){
      _posSlotDecoder[i].init();
    }

    _lenDecoder.init();
    _repLenDecoder.init();
    _posAlignDecoder.init();
    _rangeDecoder.init();
  }

  function decode(inStream, outStream, outSize){
    _rangeDecoder.setStream(inStream);
    _outWindow.setStream(outStream);
    
    init();

    var state = LZMA.Base.stateInit();
    var rep0 = 0, rep1 = 0, rep2 = 0, rep3 = 0;
    
    var nowPos64 = 0;
    var prevByte = 0;

    while(outSize < 0 || nowPos64 < outSize){
      var posState = nowPos64 & _posStateMask;
      
      if (_rangeDecoder.decodeBit(_isMatchDecoders,
        (state << LZMA.Base.k.NumPosStatesBitsMax) + posState) === 0){

        var decoder2 = _literalDecoder.getDecoder(nowPos64, prevByte);
        
        if ( !LZMA.Base.stateIsCharState(state) ){
          prevByte = decoder2.decodeWithMatchByte(_rangeDecoder, _outWindow.getByte(rep0) );
        }else{
          prevByte = decoder2.decodeNormal(_rangeDecoder);
        }

        _outWindow.putByte(prevByte);
        state = LZMA.Base.stateUpdateChar(state);
        ++ nowPos64;
        
      }else{
      
        var len;
        if (_rangeDecoder.decodeBit(_isRepDecoders, state) === 1){
          len = 0;
          if (_rangeDecoder.decodeBit(_isRepG0Decoders, state) === 0){
            if (_rangeDecoder.decodeBit(_isRep0LongDecoders,
              (state << LZMA.Base.k.NumPosStatesBitsMax) + posState) === 0){
              state = LZMA.Base.stateUpdateShortRep(state);
              len = 1;
            }
          }else{
            var distance;
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
            len = _repLenDecoder.decode(_rangeDecoder, posState) + LZMA.Base.k.MatchMinLen;
            state = LZMA.Base.stateUpdateRep(state);
          }
        }else{
          rep3 = rep2;
          rep2 = rep1;
          rep1 = rep0;
          
          len = LZMA.Base.k.MatchMinLen + _lenDecoder.decode(_rangeDecoder, posState);
          state = LZMA.Base.stateUpdateMatch(state);
          
          var posSlot = _posSlotDecoder[LZMA.Base.getLenToPosState(len)].decode(_rangeDecoder);
          if (posSlot >= LZMA.Base.k.StartPosModelIndex){
          
            var numDirectBits = (posSlot >> 1) - 1;
            rep0 = (2 | (posSlot & 1) ) << numDirectBits;
            
            if (posSlot < LZMA.Base.k.EndPosModelIndex){
              rep0 += LZMA.BitTreeDecoder.reverseDecode2(_posDecoders,
                  rep0 - posSlot - 1, _rangeDecoder, numDirectBits);
            }else{
              rep0 += (_rangeDecoder.decodeDirectBits(
                  numDirectBits - LZMA.Base.k.NumAlignBits) << LZMA.Base.k.NumAlignBits);
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
    if (properties.size < 5){
      return false;
    }

    var value = properties.readByte();
    var lc = value % 9;
    value = ~~(value / 9);
    var lp = value % 5;
    var pb = ~~(value / 5);
    
    if ( !setLcLpPb(lc, lp, pb) ){
      return false;
    }

    var dictionarySize = properties.readByte();
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
