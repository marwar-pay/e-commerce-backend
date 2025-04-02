import express from 'express'
import { VendorController } from '../controller/vendor.controller.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { verifyToken } from '../middleware/verifyToken.js';

const routes = express.Router();

routes.route("/vendor-request").patch(verifyToken, VendorController.VendorRequest);

routes.route("/update-vendor-request/:userId").patch(isAdmin, VendorController.AcceptVendorRequest);

routes.route("/incoming-vendor-requests").get(isAdmin, VendorController.incomingVendorRequests);

routes.route("/vendor-register").post(VendorController.vendorRegister);

routes.route("/vendor-login").post(VendorController.vendorLogin);

routes.route("/vendor-info").get(isAdmin, VendorController.getVendorById);

routes.route("/vendor-orders").get(isAdmin, VendorController.getVendorOrders);

routes.route("/vendor-wallet").get(isAdmin, VendorController.getVendorWallet);

export default routes;