var stream = require('stream');
var util = require('util');
var _ = require('underscore');

navigator.getUserMedia =  navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;

var vgaConstraints = {
  video: {
    mandatory: {
      maxWidth: 640,
      maxHeight: 360
    }
  }
};




util.inherits(CanvasReader, stream.Readable);

function CanvasReader(options) {
  stream.Readable.call(this, options);
  this.canvas = document.createElement('canvas');
  this.canvas.setAttribute("width", "80");
  this.canvas.setAttribute("height", "40");
  //document.body.appendChild(this.canvas);

  this.context = this.canvas.getContext('2d');
};


CanvasReader.prototype.pushFrame = function() {
  var imageData = this.context.getImageData(0, 0, 80, 40);
  var buffer = new Buffer(imageData.data);
  buffer.width = imageData.width;
  buffer.height = imageData.height;
  this.push(buffer);
};

CanvasReader.prototype._read = function() {

};

 
util.inherits(CameraReader, CanvasReader);

function CameraReader(options) {
  CanvasReader.call(this, options);
  this.initialized = false;
  this.ready = false;
};

CameraReader.prototype.init = function() {

  if ( !this.initialized ) {
    var that = this;
    navigator.getUserMedia(vgaConstraints, function(localMediaStream) {

      that.video = document.createElement('video');
      that.video.setAttribute("autoplay", "autoplay");
      //document.body.appendChild(that.video);

      that.video.src = window.URL.createObjectURL(localMediaStream);
      that.video.onloadedmetadata = function(e) {
        that.ready = true;
      };
      that.initialized = true;
    }, function(e) {
      console.error('Error while opening stream : '+ e);
    });
  }
};

CameraReader.prototype.start = function() {
  this.init();
  if ( !this.interval ) {
    var that = this;
    this.interval = setInterval(function() {
          if ( that.ready ) {
            that.pushFrame();
          }
        }, 100);
  }
  return this;
};

CameraReader.prototype.stop = function() {
  if ( this.interval ) {
    clearInterval(this.interval);
    this.interval = 0;
  }
  return this;
};

CameraReader.prototype.refresh = function() {

};

CameraReader.prototype.pushFrame = function() {
    this.context.drawImage(this.video, 0, 0, 80, 40);
    var imageData = this.context.getImageData(0, 0, 80, 40);
    var buffer = new Buffer(imageData.data);
    buffer.width = imageData.width;
    buffer.height = imageData.height;
    this.push(buffer);
};

CameraReader.prototype._read = function() {

};




util.inherits(DragDropReader, CanvasReader);

function DragDropReader(options) {
  CanvasReader.call(this, options);
  this.initialized = false;
  this.init();
};

DragDropReader.prototype.init = function() {

  if ( !this.initialized ) {

    var that = this;

    document.ondragover = function () { this.className = 'hover'; return false; };
    document.ondragend = function () { this.className = ''; return false; };
    document.ondrop = function (e) {
      e.preventDefault();
      var files = e.dataTransfer.files;
      var formData = new FormData();
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        formData.append('file', files[i]);
        var reader = new FileReader();
        reader.onload = function (event) {
          var image = new Image();
          image.src = event.target.result;

          that.context.fillStyle='#000000';
          that.context.fillRect(0, 0, 255, 255);
          that.context.drawImage(image, 0, 0, 80, 40);
          that.start();
        };
        reader.readAsDataURL(file);
      }
    }

    this.initialized = true;
  }
};

DragDropReader.prototype.start = function() {
  this.refresh();
};

DragDropReader.prototype.stop = function() {
  
};

DragDropReader.prototype.refresh = function() {
  var imageData = this.context.getImageData(0, 0, 80, 40);
  var buffer = new Buffer(imageData.data);
  buffer.width = imageData.width;
  buffer.height = imageData.height;
  this.push(buffer);
};

DragDropReader.prototype._read = function() {

};




util.inherits(GreyScaleTransform, stream.Transform);

function GreyScaleTransform(options) {
  if (!(this instanceof GreyScaleTransform))
    return new GreyScaleTransform(options);
  stream.Transform.call(this, options);
}

var yiq = function(r,g,b) {
  return (r*0.299)+(g*0.587)+(b*0.114) | 0;
};

GreyScaleTransform.prototype._transform = function(chunk, encoding, done) {

  var greyScale = [];
  greyScale.length = chunk.width * chunk.height;

  for ( var i=0 ; i<greyScale.length ; i++ ) {
    greyScale[i] = yiq(chunk[i*4], chunk[i*4+1], chunk[i*4+2]);
  }

  var buffer = new Buffer(greyScale);
  buffer.width = chunk.width;
  buffer.height = chunk.height;
  this.push(buffer);

  done();

};




util.inherits(TranslationTransform, stream.Transform);

function TranslationTransform(options) {
  stream.Transform.call(this, options);
  this.translation = [];
  this.options = _.extend({
    enabled: true
  }, options);
};

TranslationTransform.prototype._transform= function(chunk, encoding, callback) {
  if ( this.options && this.options.enabled===true ) {
    for ( var i=0 ; i<chunk.length ; i++ ) {
      chunk[i] = this.translation[chunk[i]];
    }
  }
  this.push(chunk);
  callback();
};

TranslationTransform.prototype.option = function(option, value) {
  console.log(option +'='+ value);
  this.options[option] = value;
  this.initTranslation();
};






util.inherits(ContrastTransform, TranslationTransform);

function ContrastTransform(options) {
  options = _.extend({
    strength: 1,
    turningPointX: 50,
    turningPointY: 50,
    slope: 90
  }, options);
  TranslationTransform.call(this, options);
  this.initTranslation(options);
};
ContrastTransform.prototype.initTranslation = function() {
  var e = this.options.strength / 50,
      a = this.options.turningPointX / 100,
      b = this.options.turningPointY / 100,
      s = this.options.slope / 10,
      i, x, y;

  for ( i=0 ; i<256 ; i++ ) {

    x = i / 256;
    if ( x<a ) {
      y = a*Math.pow(x/a, e);
    } else {
      y = 1-(1-a)*Math.pow((1-x)/(1-a), e);
    }
    y = Math.pow(y, Math.log(b)/Math.log(a));

    this.translation[i] = 256 * y | 0;

  }
};





util.inherits(HighContrastTransform, TranslationTransform);

function HighContrastTransform(options) {
  options = _.extend({
    bias: 128
  }, options);
  TranslationTransform.call(this, options);
  this.initTranslation(options);
};
HighContrastTransform.prototype.initTranslation = function() {
  var bias = this.options.bias,
      i;
  for ( i=0 ; i<256 ; i++ ) {
    this.translation[i] = i<bias ? 0 : 255;
  }
};



util.inherits(LuminosityTransform, TranslationTransform);

function LuminosityTransform(options) {
  options = _.extend({
    amount: 0
  }, options);
  TranslationTransform.call(this, options);
  this.initTranslation(options);
};

LuminosityTransform.prototype.initTranslation = function() {
  var amount = this.options.amount ? this.options.amount : 0,
      v;
  for ( var i=0 ; i<256 ; i++ ) {
    v = i + amount;
    if ( v<0 ) {
      v = 0;
    }
    if ( v>255 ) {
      v = 255;
    }
    this.translation[i] = v;
  }
};



util.inherits(InvertTransform, TranslationTransform);

function InvertTransform(options) {
  TranslationTransform.call(this, options);
  this.initTranslation(options);
};

InvertTransform.prototype.initTranslation = function() {
  for ( var i=0 ; i<256 ; i++ ) {
    this.translation[i] = 255-i | 0;
  }
  console.log(this.translation);
};





util.inherits(AsciiTransform, TranslationTransform);

function AsciiTransform(options) {
  if (!(this instanceof AsciiTransform))
    return new AsciiTransformer(options);
  TranslationTransform.call(this, options);

  var c = [' ', ' ', ',', '=', '/', 'L', 'K', '8', '#'];
  this.characters = [];
  for ( var i=0 ; i<256 ; i++ ) {
    this.characters[255-i] = c[((i/255)*(c.length-1)) | 0];
  }
}

AsciiTransform.prototype._transform = function(chunk, encoding, callback) {

  var s = '';
  for ( var y=0 ; y<chunk.height ; y++ ) {
    rowOffset = y * chunk.width | 0;
    for ( var x=0 ; x<chunk.width ; x++ ) {
      s += this.characters[chunk[rowOffset+x]];
    }
    s += '\n';
  }

  this.push(s, 'utf8');
  callback();

};





util.inherits(TagWriter, stream.Writable);

function TagWriter(options) {
  if (!(this instanceof TagWriter))
    return new TagWriter(options);
  stream.Writable.call(this, options);
}

TagWriter.prototype._write = function(chunk, encoding, callback) {
  document.getElementsByTagName('pre')[0].textContent = chunk.toString();
  callback();
};




util.inherits(CanvasWriter, stream.Writable);

function CanvasWriter(options) {
  if (!(this instanceof CanvasWriter))
    return new CanvasWriter(options);
  stream.Writable.call(this, options);
}

CanvasWriter.prototype._write = function(chunk, encoding, callback) {
  document.getElementsByTagName('pre')[0].textContent = chunk.toString();
  callback();
};



exports.CameraReader = CameraReader;
exports.DragDropReader = DragDropReader;
exports.GreyScaleTransform = GreyScaleTransform;
exports.LuminosityTransform = LuminosityTransform;
exports.ContrastTransform = ContrastTransform;
exports.HighContrastTransform = HighContrastTransform;
exports.InvertTransform = InvertTransform;
exports.AsciiTransform = AsciiTransform;
exports.TagWriter = TagWriter;
exports.CanvasWriter = CanvasWriter;
