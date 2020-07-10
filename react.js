let Color = require('color')

let Reverb = require('./reverb.js')
let reverb = new Reverb()

let midi = require('midi')
let input = new midi.input()
input.openPort(2);

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
  let vel = message[2]

  if (sus) {
    sustained = sustained.filter(x => x != note)
  }

  let brightness = Math.max((vel / 127) ** 3 * 100, 0.2)

  let color = Color.rgb(255, 0, 255).lightness(brightness).rotate(timer * 40)
  
  reverb.spawn(note, color.rotate(180))
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