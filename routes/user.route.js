import cloudinary from "../config/cloudinary.js";

router.get("/cloudinary-upload-image-test", async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    );

    return res.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});