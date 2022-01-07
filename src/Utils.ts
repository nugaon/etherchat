import { Utils } from '@ethersphere/bee-js'
import { Bytes } from '@ethersphere/bee-js/dist/src/utils/bytes'

export async function saveLocalStorage(key: string, value: string): Promise<void> {
  if (window.swarm && window.origin === 'null') {
    await window.swarm.localStorage.setItem(key, value)
  } else {
    window.localStorage.setItem(key, value)
  }
}

export async function loadLocalStorage(key: string): Promise<string | null> {
  if (window.swarm && window.origin === 'null') {
    const item = await window.swarm.localStorage.getItem(key)

    return item
  } else {
    return window.localStorage.getItem(key)
  }
}

export function makeBytes<Length extends number>(length: Length): Bytes<Length> {
  return new Uint8Array(length) as Bytes<Length>
}

export function fetchIndexToInt(fetchIndex: string): number {
  const indexBytes = Utils.hexToBytes(fetchIndex)
  let index = 0
  for (let i = indexBytes.length - 1; i >= 0; i--) {
    const byte = indexBytes[i]

    if (byte === 0) break

    index += byte
  }

  return index
}

export function writeUint64BigEndian(value: number, bytes: Bytes<8> = makeBytes(8)): Bytes<8> {
  const dataView = new DataView(bytes.buffer)
  const valueLower32 = value & 0xffffffff

  dataView.setUint32(0, 0)
  dataView.setUint32(4, valueLower32)

  return bytes
}

/** it gives back SOC identifiers of older feed updates from the given `fromIndex` */
export function previousIdentifiers(
  topic: Utils.Bytes<32>,
  fromIndex: number,
  maxPreviousUpdates = 3,
): Utils.Bytes<32>[] {
  const identifiers: Utils.Bytes<32>[] = []
  for (
    let updateIndex = fromIndex - 1;
    updateIndex >= 0 && fromIndex - updateIndex <= maxPreviousUpdates;
    updateIndex--
  ) {
    const indexBytes = writeUint64BigEndian(updateIndex)
    identifiers.push(Utils.keccak256Hash(topic, indexBytes))
  }

  return identifiers
}

export function encodeMessage(message: string, timeStamp?: number): Uint8Array {
  const messageFormat: MessageFormat = {
    timestamp: timeStamp || new Date().getTime(),
    message,
  }

  return new TextEncoder().encode(JSON.stringify(messageFormat))
}

export function decodeMessage(data: Uint8Array): MessageFormat {
  const dataString = new TextDecoder().decode(data)
  try {
    const jsonData: MessageFormat = JSON.parse(dataString)

    return jsonData
  } catch (e) {
    console.error('wrong datastring to decode JSON message body', dataString)
    throw e
  }
}

export function hashTopicForMessage(address: string): Utils.Bytes<32> {
  if (address.startsWith('0x')) address = address.substring(2)

  return Utils.keccak256Hash(Utils.hexToBytes(address))
}

export function prefixAddress(address: string): string {
  return address.startsWith('0x') ? address : `0x${address}`
}
