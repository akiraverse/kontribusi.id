import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../public/files"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadFile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 2MB max
});

export default uploadFile;
