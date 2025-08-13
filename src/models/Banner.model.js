import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  altText: {
    type: String,
    required: true,
  },
  page: {
    type: String,
    required: true,
    enum: ["home", "about", "products", "order-history", "contact-us"],
  },
  referenceWebsite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Websitelist",
    required: true,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
