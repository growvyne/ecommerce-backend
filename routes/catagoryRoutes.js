import express from "express";
import {
    addCatagory,
  getCategories,
} from "../controller/categoryController.js";

import { isAuthenticator, isAdmin } from "../middleware/isAuthenticator.js";

const router = express.Router();

// Public
router.get("/get-categories", getCategories);

// Admin
router.post(
  "/add-category",
 isAuthenticator,
  isAdmin,
  addCatagory
);

export default router;