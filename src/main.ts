import dotenv from 'dotenv'
dotenv.config()

import { existsSync } from 'fs'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { basename, join, resolve } from 'path'

import { SocketIOClient, init } from '@buerli.io/classcad'
import { Timing } from '@buerli.io/core'
import { ApiHistory, History } from '@buerli.io/headless'

console.info(`ClassCAD server: ${process.env.CLASSCAD_URL}`)
init(id => new SocketIOClient(process.env.CLASSCAD_URL as string, id))

const defaultFile = resolve(join(__dirname, '..', 'res', 'as1_ac_214.stp'))
const outDir = resolve(join(__dirname, '..', '.temp'))

/**
 * Loads the given data in ClassCAD/buerli and returns the created geometry of all meshes.
 *
 * @param data The data buffer containing the step file content
 * @param type The type of the content in the data buffer
 * @param api The history api
 * @returns An array containing the position, normal and index array of all meshes as string
 */
const getGeometry = async (data: Buffer, type: 'stp', api: ApiHistory) => {
  const result: { position: string; normal: string; index: string }[] = []
  const tkey = Timing.start()
  const ids = (await api.load(data, type)) || []
  Timing.dump(tkey, 'api.load:', 'fromPrevious')
  const buffGeoms = (await api.createBufferGeometry(ids[0])) || []
  Timing.dump(tkey, 'api.createBufferGeometry:', 'fromPrevious')
  for (const buffGeom of buffGeoms) {
    const position = buffGeom.attributes?.position?.array?.toString()
    const normal = buffGeom.attributes?.normal?.array?.toString()
    const index = buffGeom.index?.array?.toString()
    result.push({ position, normal, index })
  }
  return result
}

/**
 * The program entry point
 */
const main = async () => {
  let file = defaultFile
  if (process.argv.length >= 3) {
    file = resolve(process.argv[2])
    if (!existsSync(file)) {
      throw new Error(`${file} does not exist`)
    }
  }
  const outputFile = `${outDir}/${basename(file)}.json`
  await mkdir(outDir, { recursive: true })
  if (existsSync(outputFile)) {
    await unlink(outputFile)
  }

  console.info(`process file: ${file}`)

  const cad = new History()
  cad.init(async api => {
    const data = await readFile(file)
    const result = await getGeometry(data, 'stp', api)
    if (process.env.NODE_ENV === 'development') {
      // Write the result in readable format for development purpose only.
      writeFile(outputFile, JSON.stringify(result, null, 2))
    } else {
      writeFile(outputFile, JSON.stringify(result))
    }
    console.info(`output file: ${outputFile}`)
    cad.destroy()
  })
}

main()
