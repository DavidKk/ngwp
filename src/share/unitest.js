import fs from 'fs-extra'
import { Server } from 'karma'

export default function (configFile) {
  if (!fs.existsSync(configFile)) {
    throw new Error(`Config file ${configFile} is not provided.`)
  }

  let server = new Server({ configFile })
  server.start()
  return server
}
