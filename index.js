const express = require('express')
const mongojs = require('mongojs')
const app = express()
const {
    body,
    param,
    validationResult
} = require('express-validator')
// const routes = require('./routes')
// const db = mongojs('travel', ['records'])
const db = mongojs("mongodb://127.0.0.1:27017/travel", ["records"]);

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// app.use('/api', routes)

// app.get('/api/records', function (req, res) {
//   const options = req.query
//   // validate options, send 400 on error
//   const sort = options.sort || {}
//   const filter = options.filter || {}
//   const limit = 10
//   const page = parseInt(options.page) || 1
//   const skip = (page - 1) * limit
//   for (const i in sort) {
//     sort[i] = parseInt(sort[i])
//   }
//   db.records.find(filter)
//     .sort(sort)
//     .skip(skip)
//     .limit(limit, function (err, data) {
//       if (err) {
//         return res.sendStatus(500)
//       } else {
//         return res.status(200).json({
//           meta: {
//             skip,
//             limit,
//             sort,
//             filter,
//             page,
//             total: data.length
//           },
//           data,
//           links: {
//             self: req.originalUrl
//           }
//         })
//       }
//     })
// })
// app.listen(8000, function () {
//   console.log('Server running at port 8000...')
// })

app.post('/api/records', [
    body('name').not().isEmpty(),
    body('from').not().isEmpty(),
    body('to').not().isEmpty()
], function (req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.formatWith() })
        // return res.status(400).json({ errors: errors.array() });
    }
    db.records.insert(req.body, function (err, data) {
        if (err) {
            return res.status(500)
        }
        const _id = data._id
        res.append('Location', '/api/records/' + _id)
        return res.status(201).json({ meta: { _id }, data })
    })
})

app.listen(8000, function () {
    console.log('Server running at port 8000...')
})