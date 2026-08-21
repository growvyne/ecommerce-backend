import express from 'express';
import { isAdmin, isAuthenticator } from '../middleware/isAuthenticator.js';
import { createOrder, downloadInvoice, getAllOrdersAdmin, getMyOrder, getSalesData, getUserOrders, updateOrderStatus, verifyPayment } from '../controller/orderController.js';

const router=express.Router();


router.post('/create-order',isAuthenticator,createOrder)
router.post('/verify-payment',isAuthenticator,verifyPayment)
router.get('/myorder',isAuthenticator,getMyOrder)
router.get('/all',isAuthenticator,isAdmin,getAllOrdersAdmin)
router.get('/user-order/:userId',isAuthenticator,isAdmin,getUserOrders)
router.get('/sales',isAuthenticator,isAdmin,getSalesData)
router.get('/invoice/:orderId',isAuthenticator,downloadInvoice)
router.put('/update-status/:orderId',isAuthenticator,isAdmin,updateOrderStatus)

export default router;