export default (model, populateArgs, fillArgs) => async (req, res, next) => {
  // remove special query fields
  const reqQuery = { ...req.query }
  const removeFields = ['select', 'sort', 'limit', 'page']
  removeFields.forEach((param) => delete reqQuery[param])

  let queryStr = JSON.stringify(reqQuery)
  // mongoose operators
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/, (match) => `$${match}`)

  let query = model.find(JSON.parse(queryStr))

  // SELECT FIEDS
  if (req.query.select) {
    // turn comma separated into space separated
    const fields = req.query.select.replace(/,/g, ' ')
    query = query.select(fields)
  }

  // SORT RESULTS
  let sortBy = '-createdAt'
  if (req.query.sort) {
    sortBy = req.query.sort.replace(/,/g, ' ')
  }
  query = query.sort(sortBy)

  // PAGINATION
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 100
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await model.countDocuments()

  query = query.skip(startIndex).limit(limit)

  if (populateArgs) {
    for (const popArg of populateArgs) {
      const term = typeof popArg === 'string' ? popArg : popArg.path
      const excludePopulate =
        req.query.select && !req.query.select.split(',').includes(term)
      if (!excludePopulate) {
        query.populate(popArg)
      }
    }
  }

  let results = await query

  if (fillArgs) {
    const filledResProms = Promise.all(
      results.map(async (r) => {
        for (const fillArg of fillArgs) {
          const excludeFill =
            req.query.select && !req.query.select.split(',').includes(fillArg)
          if (!excludeFill) {
            return r.fill(fillArg)
          }
        }
      })
    )
    await filledResProms
  }

  // Pagination result
  const pagination = {}
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  }
  next()
}
