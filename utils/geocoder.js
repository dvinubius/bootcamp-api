import geocoder from 'node-geocoder'

const options = {
  provider: process.env.GEOCODER_PROVIDER,
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null, // 'gpx', 'string', ...
  httpAdapter: 'https',
}

export default geocoder(options)
