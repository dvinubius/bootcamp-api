import mongoose from 'mongoose'

export const connectDB = async () => {
  mongoose.set({ strictQuery: true })
  console.log('ENV: ')
  console.log(process.env)
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  const host = mongoose.connection.getClient().options.srvHost
  console.log(`MongoDB Connected: ${host}`.cyan.underline.bold)
}
