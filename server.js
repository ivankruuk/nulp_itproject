// server.js

const express = require("express")
const multer = require("multer")
const app = express()
app.use(express.urlencoded({ extended: true }));
const mongoose = require("mongoose")
require("dotenv").config()
const upload = multer({ dest: "uploads" })
const bcrypt = require("bcrypt")
const File = require("./models/File.js")

mongoose.connect(process.env.MONGO)

app.set("view engine", "ejs")

app.get("/", (req, res) => {
    res.render("index")
})

app.post("/upload",
    upload.single("file"), async (req, res) => {
        const fileData = {
            path: req.file.path,
            originalName: req.file.originalname
        }
        if (req.body.password != null &&
            req.body.password !== "") {
            fileData.password =
                await bcrypt.hash(req.body.password, 10)
        }

        const file = await File.create(fileData)
        res.render("index",
            { fileLink: `${req.headers.origin}/file/${file.id}` })
    })


app.get("/file/:id", handleDownload)
app.post("/file/:id", handleDownload)

async function handleDownload(req, res) {
    const file = await File.findById(req.params.id)

    if (file.password != null) {
        if (req.body.password == null) {
            res.render("password")
            return
        }

        if (!(await bcrypt.compare(
            req.body.password, file.password))) {
            res.render("password", { error: true })
            return
        }
    }

    file.downloadCount++
    await file.save()
    res.download(file.path, file.originalName)
}
if (process.env.NODE_ENV !== "test") {
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
}

module.exports = app; // Export the app for testing

