
const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า API Key" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "กรุณาเลือกรูปภาพก่อน" });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const base64 = req.file.buffer.toString("base64");
    const imageUrl = `data:${req.file.mimetype};base64,${base64}`;

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          {
            type: "input_text",
            text: "ช่วยวิเคราะห์สิ่งของในภาพ บอกวัสดุที่น่าจะเป็น วิธีนำกลับมาใช้ใหม่ และวิธีแยกรีไซเคิล ตอบเป็นภาษาไทยแบบเข้าใจง่าย"
          },
          {
            type: "input_image",
            image_url: imageUrl
          }
        ]
      }]
    });

    res.json({ result: response.output_text });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "วิเคราะห์ภาพไม่สำเร็จ กรุณาลองใหม่"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Eco AI เปิดใช้งานแล้วที่ http://localhost:${PORT}`);
});
