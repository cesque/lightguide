let Color = require('color')
let HID = require('node-hid')
let fs = require('fs')
let MidiPlayer = require('midi-player-js')

let colors = [
  Color.rgb(255, 0, 0),
  Color.rgb(0, 255, 0),
  Color.rgb(0, 0, 255),
  Color.rgb(255, 255, 0),
  Color.rgb(255, 0, 255),
  Color.rgb(0, 255, 255),
  Color.rgb(255,255,255),
]

var Player = new MidiPlayer.Player(midiEvent)

let vid = 6092
let pid = 5136

let keyboard = new HID.HID(vid, pid)

let array = []

keyboard.on('data', function (data) {
  console.log(data)
})

keyboard.on('error', function (err) {
  console.log('error -> ', err)
})

keyboard.write([0xa0])

process.on('SIGINT', function() {
  keyboard.close()
  console.log('HID closed... app exiting!')
  process.exit()
})

function midiEvent(event) {
  console.log(event.name)
  switch (event.name) {
    case 'Note on':
      (event.velocity == 0 ? noteOff : noteOn)(event)
      break
    case 'Controller Change':
      controllerChange(event)
      break
    case 'Set Tempo':
      Player.tempo = event.data * 1
      break  
    default:
      //console.log(event.name)
      break
  }
}

function noteOn(event) {
  console.log('NOTE ON: ',event.noteNumber)
  let note = event.noteNumber - 21
  console.log(event)
  array[note] = colors[event.track % colors.length]
  write(array)
}

function noteOff(event) {
  console.log('NOTE OFF: ', event.noteNumber)
  let note = event.noteNumber - 21

  array[note] = Color('black')
  write(array)
}

function controllerChange(event) {
  if (event.number == 64) {
    console.log('PEDAL: ', event.data)
  }
}

function write(colors) {
  let data = []
  for (let color of colors) {
    data.push(...color.rgb().array().map(x => Math.floor(x/2)))
  }
  while (data.length < 88 * 3) data.push(0)

  data.unshift(0x82)
  keyboard.write(data)
}

let timer = 0
function loop() {
  let random = n => Math.floor(Math.random() * n)
  let elapsed = process.hrtime(start)[1] / 1000000
  let seconds = elapsed / 1000
  timer += seconds
  for (let i = 0; i < 88; i++) {

  }
  write(array)
  start = process.hrtime()
}


for (let i = 0; i < 88; i++) array.push(Color.rgb(0, 0, 0))
write(array)
let start = process.hrtime()
//setInterval(loop, 33)

Player.loadFile('./input.mid')
Player.play()