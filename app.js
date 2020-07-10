let Color = require('color');

let midi = require('midi')
let input = new midi.input()

let portCount = input.getPortCount()
let portIndex = null

for(let i = 0; i<portCount; i++) {
  console.log(i + ': ' + input.getPortName(i))

  if(input.getPortName(i).indexOf('Komplete Kontrol - 1 2') > -1) {
    portIndex = i
  }
}

if(portIndex == null) {
  console.error('couldn\'t find komplete kontrol')
  process.exit(1)
}

input.openPort(portIndex);

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

input.on('message', function(deltaTime, message) {
  switch (message[0]) {
    case 144: noteOn(message, deltaTime); break  
    case 128: noteOff(message, deltaTime); break  
    default: break  
  }
})

function noteOn(message, delta) {
  console.log('noteon')
  let note = message[1] - 21
}

function noteOff(message, delta) {
  let note = message[1] - 21
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

let red = Color('red')
let timer = 0
let speed = 0.1
function loop() {
  let random = n => Math.floor(Math.random() * n)
  let elapsed = process.hrtime(start)[1] / 1000000
  let seconds = elapsed / 1000
  timer += seconds * speed
  for (let i = 0; i < 88; i++) {
    let spacing = i * 6
    let c = red.rotate((spacing + timer * 100) % 360)
    array[i] = c
  }
  write(array)
  start = process.hrtime()
}


for (let i = 0; i < 88; i++) array.push(Color.rgb(0, 0, 0))
write(array)
let start = process.hrtime()
setInterval(loop, 100)