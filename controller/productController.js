import Product from "../models/productModel.js";
import cloudinary from "../utils/cloudnary.js";
import getDataUri from "../utils/dataUri.js";
import { Cart } from "../models/cartModel.js";

// ==========================================
// 1. GET ALL UNIQUE CATEGORIES
// ==========================================
export const getCategories = async (req, res) => {
  try {
    // Fetches all distinct category tags present across saved products
    const categories = await Product.distinct("catagory");
    
    return res.status(200).json({
      success: true,
      categories: categories || []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 2. ADD PRODUCT
// ==========================================
export const addproduct = async (req, res) => {
  try {
    const { productName, productDesc, productPrice, productStock, brand, catagory } = req.body;
    const userId = req.id;

    if (!productName || !productDesc || !productPrice || !brand || !catagory) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

   let productImg = [];

for (const file of req.files) {
  if (!file || !file.buffer) continue;

  const fileUri = getDataUri(file);
  
  if (fileUri) {
    // FIX: Using the direct named import configuration reference
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: "mern_products",
    });

    productImg.push({
      url: result.secure_url,
      public_id: result.public_id,
    });
  }
}

    const newProduct = await Product.create({
      userId,
      productName,
      productDesc,
      productPrice,
      productStock: productStock ? Number(productStock) : 0,
      brand,
      catagory,
      productImg,
    });

    return res.status(201).json({
      success: true,
      message: "Product Added Successfully",
      product: newProduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 3. GET ALL PRODUCTS
// ==========================================
export const getAllproducts = async (req, res) => {
  try {
    const products = await Product.find();
    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Products available",
        products: [],
      });
    }
    return res.status(200).json({
      success: true,
      message: "Products fetch successfully",
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 4. GET SINGLE PRODUCT BY ID
// ==========================================
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 5. DELETE PRODUCT
// ==========================================
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete active binary image references out of Cloudinary storage
    if (product.productImg && product.productImg.length > 0) {
      for (const img of product.productImg) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }

    // Pull item entries out of active shopping carts globally
    await Cart.updateMany(
      {},
      {
        $pull: {
          items: { productId },
        },
      }
    );

    // Recalculate financial balances for existing shopping carts
    const carts = await Cart.find();
    for (const cart of carts) {
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      await cart.save();
    }

    await Product.findByIdAndDelete(productId);
    
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 6. UPDATE PRODUCT
// ==========================================
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      productName,
      productDesc,
      productPrice,
      productStock,
      brand,
      catagory,
      existingImages, 
      removedImages,  
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let updatedImages = [];

    // 1. Process Removed Images from Cloudinary Storage
    if (removedImages) {
      try {
        const imagesToDelete = typeof removedImages === "string" ? JSON.parse(removedImages) : removedImages;
        
        if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
          for (const imgUrl of imagesToDelete) {
            const imageObj = product.productImg.find(
              (img) => img.url === imgUrl || img.public_id === imgUrl
            );
            
            if (imageObj?.public_id) {
              await cloudinary.uploader.destroy(imageObj.public_id);
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse removed images payload array structural fields:", e);
      }
    }

    // 2. Filter out Surviving Active Cloud Images
    if (existingImages) {
      try {
        const survivingImages = typeof existingImages === "string" ? JSON.parse(existingImages) : existingImages;
        
        if (Array.isArray(survivingImages)) {
          updatedImages = product.productImg.filter((img) =>
            survivingImages.some((surv) => surv.public_id === img.public_id || surv === img.url || (typeof surv === 'object' && surv.public_id === img.public_id))
          );
        }
      } catch (e) {
        console.error("Failed to parse existing images payload array structural fields:", e);
        updatedImages = [...product.productImg];
      }
    } else {
      updatedImages = [...product.productImg]; 
    }

    // 3. FIX: Handle incoming Upload Staging Buffers safely
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        // Guard check to skip empty iterations
        if (!file || !file.buffer) continue;

        const fileUri = getDataUri(file);
        
        if (fileUri) {
          // FIX: Passed raw fileUri string directly and removed '.content'
          const result = await cloudinary.uploader.upload(fileUri, {
            folder: "mern_products",
          });
          
          updatedImages.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    }

    // 4. Mutation Mapping execution logic updates
    product.productName = productName || product.productName;
    product.productDesc = productDesc || product.productDesc;
    product.productPrice = productPrice !== undefined ? Number(productPrice) : product.productPrice;
    product.brand = brand || product.brand;
    product.catagory = catagory ? catagory.trim().toLowerCase() : product.catagory; // normalized format
    product.productImg = updatedImages;

    if (productStock !== undefined) {
      product.productStock = Number(productStock);
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};