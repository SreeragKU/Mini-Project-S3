const express = require("express");
const router = express.Router();
const { requireSignin, isAdmin, isAuthor, isSubscriber } = require("../middlewares");
const {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  currentUser,
  users,
  toggleUserStatus,
  verifyOtp,
  sendOtp, 
  createUser,
  currentUserProfile,
  updateUserByAdmin,
  updateUserByUser,
} = require("../controllers/auth"); 

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/send-otp", sendOtp);
router.get("/current-admin", requireSignin, isAdmin, currentUser);
router.get("/current-author", requireSignin, isAuthor, currentUser);
router.get("/current-subscriber", requireSignin, isSubscriber, currentUser);
router.get("/current-reader", requireSignin, currentUser);
router.get("/users", requireSignin, isAdmin, users);
router.put("/users/:userId/toggle", requireSignin, isAdmin, toggleUserStatus);
router.post("/create-user", requireSignin, isAdmin, createUser);
router.get('/user/:userId', requireSignin, currentUserProfile);
router.put('/update-user-by-admin', requireSignin, isAdmin, updateUserByAdmin);
router.put('/update-user-by-user', requireSignin, updateUserByUser);

module.exports = router;
