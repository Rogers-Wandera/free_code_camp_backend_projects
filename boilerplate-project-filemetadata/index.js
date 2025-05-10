var express = require("express");
var cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

var app = express();

app.use(cors());
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});
const uploadHandler = upload.single("upfile");
app.post(
  "/api/fileanalyse",
  (req, res, next) => {
    uploadHandler(req, res, () => {
      if (!req.file) {
        return res.json({ error: "No file uploaded" });
      }
      next();
    });
  },
  (req, res) => {
    const { originalname, mimetype, size } = req.file;
    res.json({ name: originalname, type: mimetype, size });
  }
);

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Your app is listening on port " + port);
});
