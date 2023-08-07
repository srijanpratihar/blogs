require('dotenv').config();
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
//configure cloudinary
cloudinary.config({
    cloud_name: 'daexfwdsa',
    api_key: 871893526942547,
    api_secret: 'TO2TPx8rpdXvNYxsFMWUpv_FXRI',
});

//instance of cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary,
    allowerdFormats: ['jpg', 'jpeg', 'png'],
    params: {
        folder: 'blog-app-v3',
        transformation: [{ width: 500, height: 500, crop: "limit" }],
    }
});
module.exports = storage;