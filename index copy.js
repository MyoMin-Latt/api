
// mongodb://localhost:27017/

const express = require("express");
const app = express();
const mongojs = require("mongojs");
const db = mongojs("mongodb://127.0.0.1:27017/travel", ["records"]);

const {
    body,
    param,
    validationResult
} = require("express-validator");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// use() Function ကို Middleware တွေကြေညာZို့သုံးပါတယ်။
// Middleware ဆိုတာ လိုရင်းအနှစ်ချုပ်ကတော့
// Request တစ်ခုဝင်လာတာနဲ့ ကြားထဲကZမ်းပြီး အလုပ်လုပ်ပေးမယ့် လုပ်ဆောင်ချက်လေးတွေပါ။

// Get All Records
// app.get("/api/records", function (req, res) {
//     db.records.find(function (err, data) {
//         if (err) {
//             return res.sendStatus(500);
//         } else {
//             return res.status(200).json({
//                 meta: { total: data.length },
//                 data
//             });
//         }
//     });
// });

// Get all records
app.get("/api/records", function (req, res) {
    const options = req.query;
    // validate options, send 400 on error
    const sort = options.sort || {};
    const filter = options.filter || {};
    const limit = 10;
    const page = parseInt(options.page) || 1;
    const skip = (page - 1) * limit;
    for (i in sort) {
        sort[i] = parseInt(sort[i]);
    }
    db.records.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit, function (err, data) {
            if (err) {
                return res.sendStatus(500);
            } else {
                // return res.status(200).json({
                //     meta: { total: data.length },
                //     data
                // });
                return res.status(200).json({
                    meta: {
                        skip,
                        limit,
                        sort,
                        filter,
                        page,
                        total: data.length,
                    },
                    data,
                    links: {
                        self: req.originalUrl,
                    }
                });

            }
        });
});

// Insert Data
app.post("/api/records", [
    body("name").not().isEmpty(),
    body("from").not().isEmpty(),
    body("to").not().isEmpty(),
], function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.formatWith() });
        // return res.status(400).json({ errors: errors.array() });
    }
    db.records.insert(req.body, function (err, data) {
        if (err) {
            return res.status(500);
        }
        const _id = data._id
        res.append("Location", "/api/records/" + _id);
        return res.status(201).json({ meta: { _id }, data });
    });
});

// Update and insert
app.put("/api/records/:id", [
    param("id").isMongoId(),
], function (req, res) {
    const _id = req.params.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    db.records.count({
        _id: mongojs.ObjectId(_id)
    }, function (err, count) {
        if (count) {
            const record = {
                _id: mongojs.ObjectId(_id),
                ...req.body
            };

            db.records.save(record, function (err, data) {
                return res.status(200).json({
                    meta: { _id },
                    data
                });
            });
        } else {
            db.records.save(req.body, function (err, data) {
                return res.status(201).json({
                    meta: { _id: data._id },
                    data
                });
            });
        }
    });
});

// Update
app.patch("/api/records/:id", function (req, res) {
    const _id = req.params.id;
    db.records.count({
        _id: mongojs.ObjectId(_id)
    }, function (err, count) {
        if (count) {
            db.records.update(
                { _id: mongojs.ObjectId(_id) },
                { $set: req.body },
                { multi: false },
                function (err, data) {
                    db.records.find({
                        _id: mongojs.ObjectId(_id)
                    }, function (err, data) {
                        return res.status(200).json({
                            meta: { _id }, data
                        });
                    });
                }
            )
        } else {
            return res.sendStatus(404);
        }
    });
});

// Delete
app.delete("/api/records/:id", function (req, res) {
    const _id = req.params.id;
    db.records.count({
        _id: mongojs.ObjectId(_id)
    }, function (err, count) {
        if (count) {
            db.records.remove({
                _id: mongojs.ObjectId(_id)
            }, function (err, data) {
                return res.sendStatus(204);
            });
        } else {
            return res.sendStatus(404);
        }
    });
});

// Test
app.get("/test", function (req, res) {
    return res.json(req.query);
});
// localhost: 8000 / test ? sort[name] = 1 & filter[from]=Yangon & filter[to]=Yangon & page=2

// Initiate
app.listen(8000, function () {
    console.log("Server running at port 8000...");
});


// Use with router.js
// const express = require("express");
// const app = express();
// const routes = require("./routes");
// app.use("/api", routes);
// app.listen(8000, function () {
//     console.log("Server running at port 8000...");
// });



// const express = require("express");
// const app = express();
// app.get("/api/people", function (req, res) {
//     const data = [
//         { name: "Bobo", age: 22 },
//         { name: "Nini", age: 23 },
//     ];
//     return res.status(200).json(data);
// });
// app.get("/api/people/:id", function (req, res) {
//     const id = req.params.id;
//     return res.status(200).json({ idNumber: id });
//     // return res.status(200).json({ id });
// });
// app.listen(8000, function () {
//     console.log("Server running at port 8000...");
// });



//  req မှာ Request နဲ့ပက်သက်တဲ့ Header တွေBody တွေ အကုန်ရှိပါတယ်။ တစ်ခြားအသုံးဝင်နိုင်တဲ့ Cookie တို့ Host တို့ IP Address တို့လည်း ရှိပါတယ်။
// အလားတူပဲ res ကို သုံးပြီးတော့ လိုအပ်တဲ့ Response Header, Status Code နဲ့ Body တွေ သတ်မှတ်လို့ရပါတယ်။

// res.status(204).end()
// 204 ရဲ့ သဘောကိုက No Content ဖြZစ်လို့ Response Body မပို့သင့်ပါဘူး။
// sendStatus()

// Response Header
// res.set({
//     "Location": "http://domain/api/people/3",
//     "X-Rate-Limit-Limit": 60,
// });
// res.append("X-Rate-Limit-Remaining": 58);

// အသစ်ထပ်ထည့်လိုက်တဲ့ကုဒ် အလုပ်လုပ်Zို့ အတွက် အခုလို Server ကို ပြန်စပေးရတာပါ။

// MongoDB ကို Express ကနေ ချိတ်နိုင်Zို့အတွက် mongojs လို့ခေါ်တဲ့ Package ကို ရယူအသုံးပြုပါ
// npm i mongojs body - parser 