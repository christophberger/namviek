import { Redis } from 'ioredis'
import crypto from 'crypto'

let connected = false
let error = false

export enum CKEY {
  USER_ORGS = 'USER_ORGS',
  USER_PROJECT = 'USER_PROJECT',
  PROJECT_STATUS = 'PROJECT_STATUS',
  PROJECT_MEMBER = 'PROJECT_MEMBER',
  PROJECT_POINT = 'PROJECT_POINT',
  TASK_QUERY = 'TASK_QUERY'
}

type CACHE_KEY = CKEY | (CKEY | string)[]

let redis: Redis

try {
  redis = new Redis(process.env.REDIS_HOST)
  redis.once('connect', () => {
    connected = true
    error = false
    console.log('redis connection established')
  })

  redis.on('error', err => {
    if (error) return
    console.log('redis connection error')
    error = true
    // console.log(error)
  })
} catch (error) {
  console.log('redis connection error')
}

type RedisValue = string | number | Buffer
type RedisJSONValue = {
  [key: string]: unknown
}

// export const setCache = (key: string, value: RedisValue) => {
//   if (!connected) {
//     return
//   }
//   redis.set(key, value)
// }
//const e
const genKey = (key: CACHE_KEY) => {
  let cacheKey = ''
  if (Array.isArray(key)) {
    cacheKey = key.join('_')
  } else {
    cacheKey = key
  }

  return cacheKey
}

export const genKeyFromSource = (source: { [key: string]: unknown }) => {
  const digest = crypto
    .createHash('sha256')
    .update(JSON.stringify(source), 'utf8')
    .digest()
  return digest.toString('base64')
}

export const setJSONCache = (
  key: CACHE_KEY,
  value: RedisJSONValue | RedisJSONValue[]
) => {
  try {
    redis.set(genKey(key), JSON.stringify(value))
  } catch (error) {
    console.log('set redis cache error')
  }
}

export const getJSONCache = async (key: CACHE_KEY) => {
  if (!connected) {
    return null
  }

  try {
    const value = await redis.get(genKey(key))
    const parseValue = JSON.parse(value)

    if (Object.keys(parseValue).length) {
      return parseValue
    }

    return null
  } catch (error) {
    return null
  }
}

export const delCache = async (key: CACHE_KEY) => {
  try {
    redis.del(genKey(key))
  } catch (error) {
    console.log(`delete redis key {${key}} error`)
  }
}