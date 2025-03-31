import express from 'express'
import { VendorController } from '../controller/vendor.controller.js';
import { VendorController as Vendors } from '../controller/Vendor.controller.js'
import { isAdmin } from '../middleware/isAdmin.js';
import { verifyToken } from '../middleware/verifyToken.js';

const routes = express.Router();

routes.route("/vendor-request").patch(verifyToken, VendorController.VendorRequest);

routes.route("/update-vendor-request/:userId").patch(isAdmin, VendorController.AcceptVendorRequest);

routes.route("/incoming-vendor-requests").get(isAdmin, VendorController.incomingVendorRequests);

routes.route("/vendor-register").post(Vendors.vendorRegister);

routes.route("/vendor-login").post(Vendors.vendorLogin);

routes.route("/vendor-info").get(isAdmin, Vendors.getVendorById);

export default routes;