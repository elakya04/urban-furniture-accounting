// import multer from "multer";

// const storage = multer.memoryStorage();

// const upload = multer({
//   storage,

//   limits: {
//     fileSize: 5 * 1024 * 1024
//   },

//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed"));
//     }
//   }
// });

// export default upload;

import multer from "multer";
import cloudinary from "../config/cloudinary.js"; // adjust path to your cloudinary config

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) { //format check
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

const uploadProfileImage = [
  multerUpload.single("profile"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return next();
      }

      const image = req.file;
      const base64Url = `data:${image.mimetype};base64,${image.buffer.toString("base64")}`;

      const result = await cloudinary.uploader.upload(base64Url);

      req.body.profile = result.url;

      next();
    } catch (err) {
      return res.status(500).json({
        message: "Image upload failed",
        error: err.message
      });
    }
  }
];

export default uploadProfileImage;