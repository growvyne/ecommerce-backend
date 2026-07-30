import express from "express";
import { isAuthenticator } from "../middleware/isAuthenticator.js";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateQuantity,
} from "../controller/cartController.js";

const router = express.Router();

//product routes
router.get("/", isAuthenticator, getCart);
router.post("/add", isAuthenticator, addToCart);
router.put("/update", isAuthenticator, updateQuantity);
router.delete("/remove", isAuthenticator, removeFromCart);

export default router;
