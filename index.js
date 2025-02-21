require("dotenv").config();
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const cors = require("cors");
const { TwitterApi } = require("twitter-api-v2");


const fs = require("fs");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());


const upload = multer({ dest: "uploads/" });
const tmpDir = path.join(__dirname, "tmp");
const resizedFolderPath = path.join(tmpDir, "resized");



if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
}
if (!fs.existsSync(resizedFolderPath)) {
    fs.mkdirSync(resizedFolderPath);
    console.log("✅ /resized folder created");
}


const sizes = [
  { width: 300, height: 250 },
  { width: 728, height: 90 },
  { width: 160, height: 600 },
  { width: 300, height: 600 },
];


const twitterClient = new TwitterApi({
    appKey: process.env.API_KEY,
    appSecret: process.env.API_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_SECRET,
  });
  
  const rwClient = twitterClient.readWrite;
  

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  const resizedImages = [];
  const originalPath = req.file.path;

  try {
    for (let size of sizes) {
        const newPath = path.join(resizedFolderPath, `${Date.now()}_${size.width}x${size.height}.jpg`);
      await sharp(originalPath)
        .resize(size.width, size.height)
        .toFormat("jpeg")
        .toFile(newPath);

      resizedImages.push(newPath);
    }

    
    for (let imgPath of resizedImages) {
      await postToX(imgPath);
    }

    res.json({ message: "Images uploaded and posted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Image processing or upload failed.");
  } finally {
    fs.unlinkSync(originalPath); 
  }
});


async function postToX(imagePath) {
    try {
      const mediaId = await twitterClient.v1.uploadMedia(imagePath); 
  
      
      await twitterClient.v1.tweet("Here is my resized image!", { media_ids: [mediaId] });
  
      console.log("✅ Image posted successfully!");
    } catch (error) {
      console.error("❌ Error posting to X:", error);
    }
  }
  

app.listen(5000, () => console.log("Server running on port 5000"));
