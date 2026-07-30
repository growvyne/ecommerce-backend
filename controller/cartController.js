import { Cart } from "../models/cartModel.js";
import Product from "../models/productModel.js";

//get cart
export const getCart = async (req, res) => {
  try {
    //this get from middleware
    const userId = req.id;

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.json({ success: true, cart: [] });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//add
export const addToCart = async (req, res) => {
  try {
    const userId = req.id; // ← Use req.user.id (from auth middleware)
    const { productId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
  return res.status(404).json({
    success: false,
    message: "Product not found",
  });
}

if (product.productStock <= 0) {
  return res.status(400).json({
    success: false,
    message: "Product is out of stock",
  });
}

    // Find user's cart or create new one
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{
          productId,
          quantity: 1,
          price: product.productPrice
        }],
        totalPrice: product.productPrice,
      });
    } else {
      // Check if product already in cart
const itemIndex = cart.items.findIndex(
  (item) => item.productId && item.productId.toString() === productId
);
      if (itemIndex > -1) {

    if (cart.items[itemIndex].quantity >= product.productStock) {
        return res.status(400).json({
            success:false,
            message:"No more stock available"
        });
    }

    cart.items[itemIndex].quantity += 1;

}
      
      else {
        // Add new item
        cart.items.push({
          productId,
          quantity: 1,
          price: product.productPrice
        });
      }

      // Recalculate totalPrice (Fixed)
      cart.totalPrice = cart.items.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
      }, 0);
    }

    // Save cart
    await cart.save();

    // Populate product details before sending response
    const populatedCart = await Cart.findById(cart._id).populate("items.productId");

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart: populatedCart,
    });
  } catch (error) {
    console.error("Add to Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update
export const updateQuantity=async(req,res)=>{
    try {
         const userId = req.id;
         const { productId,type } = req.body;

         let cart=await Cart.findOne({userId})
         if (!cart) 
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    //check the item in the user's cart
    const item = cart.items.find(
  item => item.productId.toString() === productId
);
      if(!item) return res.status(404).json({
        success: false,
        message: "Item not found",
      });
if (type === "increase") {

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found",
        });
    }

    if (item.quantity >= product.productStock) {
        return res.status(400).json({
            success: false,
            message: "No more stock available",
        });
    }

    item.quantity += 1;
}
      if(type ==="decrease" && item.quantity >1)item.quantity-=1;

      cart.totalPrice=cart.items.reduce((acc,item)=>acc + item.price* item.quantity,0)
      await cart.save()
      cart =await cart.populate("items.productId")

      res.status(200).json({
      success: true,
      cart
      //message: "Cart Updated Successfully",
    }); 
    } catch (error) {
       return res.status(500).json({
      success: false,
      message: error.message,
    }); 
    }
}

//delete
export const removeFromCart=async(req,res)=>{
    try {
         const userId = req.id;
         const { productId,type } = req.body;

           let cart=await Cart.findOne({userId})
             if (!cart) 
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });

     cart.items = cart.items.filter(
  item => item.productId.toString() !== productId
);
      cart.totalPrice=cart.items.reduce((acc,item)=>acc+ item.price* item.quantity,0)
    

      cart=await cart.populate("items.productId")
       await cart.save()

     
      res.status(200).json({
      success: true,
      cart
      //message: "Cart deleted Successfully",
    }); 
    } catch (error) {
       return res.status(500).json({
      success: false,
      message: error.message,
    }); 
    }
}