let Color = require('color')

let Reverb = require('./reverb.js')
let reverb = new Reverb()

let midi = require('midi')
let input = new midi.input()
input.openPort(0);

let HID = require('node-hid')

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

let toneColorsFifths = [
  Color.rgb(255, 255, 0), // c
  Color.rgb(128, 0, 255), // cs
  Color.rgb(0, 255, 0), // d
  Color.rgb(255, 0, 128), //ds
  Color.rgb(0, 255, 255), //e
  Color.rgb(255, 128, 0), //f
  Color.rgb(0, 0, 255), //fs
  Color.rgb(128, 255, 0), //g
  Color.rgb(255, 0, 255), //gs
  Color.rgb(0, 255, 128), //a
  Color.rgb(255, 0, 0), //as
  Color.rgb(0, 128, 255), //b
]

let c = Color.rgb(0, 255, 255)
let maxRot = 270
let toneColorsConsonance = [
  c.rotate(0), // octave
  c.rotate(9 * (maxRot / 11)), // m2nd
  c.rotate(7 * (maxRot / 11)), // 2nd
  c.rotate(5 * (maxRot / 11)), // m3rd
  c.rotate(3 * (maxRot / 11)), // 3rd
  c.rotate(2 * (maxRot / 11)), // 4th
  c.rotate(11 * (maxRot / 11)), // tritone
  c.rotate(1 * (maxRot / 11)), // 5th
  c.rotate(6 * (maxRot / 11)), // m6th
  c.rotate(4 * (maxRot / 11)), // 6th
  c.rotate(8 * (maxRot / 11)), // m7th
  c.rotate(10 * (maxRot / 11)), // 7th
]


keyboard.write([0xa0])

process.on('SIGINT', function() {
  keyboard.close()
  console.log('HID closed... app exiting!')
  process.exit()
})

input.on('message', function (deltaTime, message) {
  switch (message[0]) {
    case 144: noteOn(message, deltaTime); break  
    case 128: noteOff(message, deltaTime); break
    case 176: 
      //console.log(message) 
      if (message[1] == 11) expressionPedal(message, deltaTime)
      if (message[1] == 64) sustainPedal(message, deltaTime)
      break  
    default: break  
  }
})


let sustained = []
let sus = false

function noteOn(message, delta) {
  let note = message[1] - 21

  if (sus) {
    sustained = sustained.filter(x => x != note)
  }

  let color = toneColorsConsonance[(note + 9) % 12]
  
  reverb.spawn(note, color)
  array[note] = color
}

function noteOff(message, delta) {
  let note = message[1] - 21

  if (sus) {
    sustained.push(note)
  } else {
    array[note] = Color.rgb(0,0,0)
  }
}

function sustainPedal(message, deltaTime) {
  if (message[2] > 64) {
    sus = true
  } else {
    sus = false
    for (let index of sustained) {
      array[index] = Color.rgb(0,0,0)
    }
    sustained = []
  }
}

let reverbMix = 0
function expressionPedal(message, deltaTime) {
  reverbMix = message[2] / 128
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

function add(a, b) {
  return Color.rgb(
    Math.min(a.red() + b.red(), 255),
    Math.min(a.green() + b.green(), 255),
    Math.min(a.blue() + b.blue(), 255)
  )
}

let timer = 0
let fadePercentage = 0.02
function loop() {
  let random = n => Math.floor(Math.random() * n)
  let elapsed = process.hrtime(start)[1] / 1000000
  let seconds = elapsed / 1000
  timer += seconds

  reverb.update()
  let a = []
  for (let i = 0; i < array.length; i++) {
    array[i] = array[i].darken(fadePercentage)
    a.push(add(array[i], reverb.array[i].darken(reverb.mix).darken(reverbMix)))
  }
  write(a)
  start = process.hrtime()
}

let buttons = new Array(28).fill(0)
buttons.unshift(0x80)
keyboard.write(buttons)

for (let i = 0; i < 88; i++) array.push(Color.rgb(0, 0, 0))
write(array)
let start = process.hrtime()
setInterval(loop, 33)