var $ = require('jquery');
var capture = require('./capture.js');

var currentReader;

var curve = function(canvas, translation) {
  if (  !canvas[0] ) {
    return;
  }
  var context = canvas[0].getContext('2d');
  context.fillStyle='#FFFFFF';
  context.fillRect(0, 0, 255, 255);
  context.fillStyle='#000000';
  for ( var i=0 ; i<256 ; i++ ) {
    var v = translation[i];
    context.fillRect(i, 255-v, 1, v);
  }
};

/**
 * Launches a reader, with transformations needed.
 */
var initializeReader = function(reader) {

  var luminosityTransform = new capture.LuminosityTransform(),
      contrastTransform = new capture.ContrastTransform(),
      highContrastTransform = new capture.HighContrastTransform(),
      invertTransform = new capture.InvertTransform(); 

  listenConfigurationChanges($('#luminosity'), luminosityTransform);
  listenConfigurationChanges($('#contrast'), contrastTransform);
  listenConfigurationChanges($('#highContrast'), highContrastTransform);
  listenConfigurationChanges($('#invert'), invertTransform);

  reader
    .pipe(new capture.GreyScaleTransform())
    .pipe(luminosityTransform)
    .pipe(contrastTransform)
    .pipe(highContrastTransform)
    .pipe(invertTransform)
    .pipe(new capture.AsciiTransform())
    .pipe(new capture.TagWriter());
};

var value = function(input) {
  if ( input.prop('type')==='checkbox' ) {
    return input.is(':checked');
  } else  if ( input.prop('type')==='text' ) {
    return input.val();
  } else {
    return input.val() | 0;
  }
};

var listenConfigurationChanges = function(element, configurable) {
  element
    .find('input')
        .each(function() {
          var input = $(this);
          input.change(function() {
            configurable.option(input.prop('name'), value(input));
            currentReader.refresh();
          });
          input.change();
        });
};

$(function() {

  var readers = [
    new capture.DragDropReader(),
    new capture.CameraReader()
  ];
  currentReader = readers[0];

  $('button').click(function(e) {
    e.preventDefault();

    currentReader.stop();
    if ( currentReader===readers[0] ) {
      $(this).text('Stop capture');
      currentReader = readers[1];
    } else {
      $(this).text('Start capture');
      currentReader = readers[0];
    }
    currentReader.start();

  });

  for ( var i=0 ; i<readers.length ; i++ ) {
    initializeReader(readers[i]);
  }

}); 
