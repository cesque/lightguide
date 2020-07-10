let Color = require('color')

function add(a, b) {
  return Color.rgb(
    Math.min(a.red() + b.red(), 255),
    Math.min(a.green() + b.green(), 255),
    Math.min(a.blue() + b.blue(), 255)
  )
}

class Reverb {
  constructor() {
    this.array = []
    for (let i = 0; i < 88; i++) this.array.push(Color.rgb(0, 0, 0))
    
    this.particles = []

    this.mix = 0.5

    this.defaultSpeed = 1.77
  }

  update() {
    for (let particle of this.particles) {
      particle.x += particle.speed
      if (particle.x <= 1 || particle.x >= 86) {
        //particle.dead = true
        //continue
        particle.speed *= -1;
        continue
      }

      if (particle.color.luminosity() < 0.0001) {
        particle.dead = true
      }

      let index1 = Math.floor(particle.x)
      let index2 = Math.ceil(particle.x)

      let diff1 = 1 - Math.abs(index1 - particle.x)
      let diff2 = 1 - Math.abs(index2 - particle.x)

      particle.color = particle.color.darken(particle.fade)

      this.array[index1] = add(this.array[index1], particle.color.darken(0))
      this.array[index2] = add(this.array[index2], particle.color.darken(0))
    }

    for (let i = 0; i < 88; i++){
      this.array[i] = this.array[i].darken(0.1)
    }

    this.particles = this.particles.filter(x => !x.dead)
  }

  spawn(x, color) {
    if(color == undefined) color = Color('white')
    this.particles.push({
      color: color,
      x: x,
      speed: this.defaultSpeed,
      fade: 0.1,
    })
    this.particles.push({
      color: color,
      x: x+1,
      speed: -this.defaultSpeed,
      fade: 0.1,
    })
  }
}

module.exports = Reverb