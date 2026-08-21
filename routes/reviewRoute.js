import express from "express";
import { isAuthenticator } from "../middleware/isAuthenticator.js";
import { createProductReview, getProductReviews } from "../controller/reviewController.js";

const router = express.Router();

router.post("/add",isAuthenticator,createProductReview);

router.get("/product/:productId",getProductReviews);

export default router;