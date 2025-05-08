require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const app = express();

let shorturls = [];
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const generateShortUrl = () => {
  const shortUrls = shorturls.length + 1;
  const random = Math.floor(Math.random() * shortUrls);
  const exists = shorturls.find((url) => url.shortUrl === random);
  if (exists) {
    return generateShortUrl();
  }
  return random;
};

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  const { url } = req.body;
  let hostname;
  try {
    const parsedUrl = new URL(url);
    hostname = parsedUrl.hostname;
  } catch (e) {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(hostname, (err, address, family) => {
    if (err) {
      res.json({ error: "invalid url", errMsg: err.message });
      return;
    }
    const shortUrl = generateShortUrl();
    shorturls.push({ url, shortUrl });
    res.json({ original_url: url, short_url: shortUrl });
  });
});

app.get("/api/shorturl/:shortUrl", function (req, res) {
  const { shortUrl } = req.params;
  const url = shorturls.find((url) => url.shortUrl === Number(shortUrl));
  if (!url) {
    return res.json({ error: "No short url found" });
  }
  res.redirect(url.url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
