var characters = [];

var scale = 8;

exports.setCharacters = function(c) {
  for ( var i=0 ; i<255 ; i++ ) {
    characters[i] = c[i/255*(c.length-1) | 0];
  }
};

exports.toAscii = function(imageData) {
  var i=0;
  var s = '';
  var dy = scale * 1.8 | 0;
  var dx = scale;
  for ( var y=0 ; y<imageData.height ; y+=dy ) {
    for ( var x=0 ; x<imageData.width ; x+=dx ) {
      i = (y*imageData.width*4+x*4);
      var gs = yiq(imageData.data[i], imageData.data[i+1], imageData.data[i+2]);
      s += characters[gs];
    }
    s += "\n";
  }
  return s;
};

var yiq = function(r,g,b) {
  return (r*0.299)+(g*0.587)+(b*0.114) | 0;
};

exports.setCharacters([
  ' ', '\'', '.', '^', '*', ':', ';',
  '!', '/','T', 'X', 'F', '0',
  '#']);
