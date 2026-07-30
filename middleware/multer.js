import multer from "multer";

const storage = multer.memoryStorage();

// Single Upload
export const singleUpload = multer({
  storage,
}).single("profilePic");

// Multiple Upload - For Products
export const uploadMultiple = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per image
}).array("productImg", 5);   // Must match frontend