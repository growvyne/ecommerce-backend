import express from 'express'
import { addproduct, deleteProduct, getAllproducts, getCategories, getProductById, updateProduct } from "../controller/productController.js";
import { isAdmin, isAuthenticator } from "../middleware/isAuthenticator.js";
import { uploadMultiple} from '../middleware/multer.js'
 


const router=express.Router()

//product routes
router.post(
  "/add-product",
  isAuthenticator,
  isAdmin,
  uploadMultiple,
  addproduct
);
router.get('/getallproducts',getAllproducts)
router.get("/get-product/:id", getProductById);
router.put("/update/:productId",isAuthenticator,isAdmin,uploadMultiple,updateProduct)
router.delete("/delete/:productId",isAuthenticator,isAdmin,deleteProduct)
router.get('/categories',getCategories);

export default router