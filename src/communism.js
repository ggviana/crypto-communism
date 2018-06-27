import { spawn } from 'child_process'
const ANTHEM_PATH = './resources/ussr_anthem.mp3'
let defaultDeviceCache = null

export default {
  spread,
  spreadForMotherland
}

const play = ({ timeout }) => new Promise(resolve => {
  const music = spawn('ffplay', ['-nodisp', '-autoexit', ANTHEM_PATH])

  if (timeout) {
    setTimeout(() => {
      music.kill()
      resolve()
    }, timeout)
  }

  music.on('close', () => resolve())
})

const amixer = (args = []) => new Promise((resolve, reject) => {
  let output = ''

  const amixer = spawn('amixer', args)

  amixer.stdout.on('data', data => output += data)

  amixer.stderr.on('data', data => {
    reject(new Error('Alsa Mixer Error: ' + data))
  })

  amixer.on('close', () => resolve(output.trim()))
})

const reDefaultDevice = /Simple mixer control \'([a-z0-9 -]+)\',[0-9]+/i
const defaultDevice = () => new Promise((resolve, reject) => {
  if (defaultDeviceCache) {
    return resolve(defaultDeviceCache)
  }

  return amixer().then(output => {
    let devices = reDefaultDevice.exec(output)
    if (devices === null) {
      reject(new Error('Alsa Mixer Error: failed to parse output'))
    } else {
      defaultDeviceCache = devices[1]
      resolve(defaultDeviceCache)
    }
  })
})

const reInfo = /[a-z][a-z ]*\: Playback [0-9-]+ \[([0-9]+)\%\] (?:[[0-9\.-]+dB\] )?\[(on|off)\]/i
const getInfo = () => defaultDevice()
  .then(device => amixer(['get', device]))
  .then(output => {
    let info = reInfo.exec(output)
    if (info === null) {
      throw new Error('Alsa Mixer Error: failed to parse output')
    } else {
      return {
        volume: parseInt(info[1]),
        muted: (info[2] === 'off')
      }
    }
  })

const getVolume = () => getInfo().then(info => info.volume)
const setVolume = value => defaultDevice().then(device => amixer(['set', device, value + '%']))

function spread () {
  return play({
    timeout: 20000
  })
}

function spreadForMotherland () {
  let previousVolume
  return getVolume()
    .then(volume => previousVolume = volume)
    .then(() => setVolume(100))
    .then(() => spread())
    .then(() => setVolume(previousVolume))
}
