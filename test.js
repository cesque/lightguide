let midi = require('midi')
 
// Set up a new input. 
let input = new midi.input()

input.openPort(0);
 
// Configure a callback. 
input.on('message', function(deltaTime, message) {
    console.log('m:' + message + ' d:' + deltaTime)
})