const path = require("path");
const bcrypt = require('bcrypt');
const { sequelize, User, Product } = require('../models');
const express = require('express');
const { json } = require('sequelize');
const app = express();

////StatsD 
const StatsD = require('statsd-client');
const statsClient = new StatsD({
  host: 'localhost',
  port: 8125
});

//Logger File Winston
const winston = require('winston');
const logConfiguration = {
    transports: [
        new winston.transports.File({
            level: 'debug',
            // Create the log directory if it does not exist
            filename: '/home/ec2-user/scripts/tester.log'
        })
    ]
};
const logger = winston.createLogger(logConfiguration);


app.use(express.json());

function decodeBase64(req) {
  const hashedHeader = req.headers.authorization;
  const encoded = hashedHeader.substring(6, hashedHeader.length);
  const base64Val = Buffer.from(encoded, "base64");
  const decoded = base64Val.toString("utf-8");
  return decoded;
}


app.get("/healthz", (req, res) => {
  try {
    statsClient.increment('systemname.subsystem.healthz_api');
    logger.debug("healthz hit");
    res.status(200).json("server responds with 200 OK if it is healhty.", 200);
  } catch (err) {
    res.json(err.message);
  }
});

app.post('/v1/user', async (req, res) => {
  const { first_name, last_name, password, username } = req.body;
  statsClient.increment('systemname.subsystem.post_user_api');
  logger.debug("New User Create API hit");
  if (!first_name) {
    logger.debug("Missing first_name parameter");
    return res.status(400).json({ error: 'Missing first_name parameter' });
  }

  if (!last_name) {
    logger.debug("Missing last_name parameter");
    return res.status(400).json({ error: 'Missing last_name parameter' });
  }

  if (!password) {
    logger.debug("Missing password parameter");
    return res.status(400).json({ error: 'Missing password parameter' });
  }

  if (!username) {
    logger.debug("Missing username parameter");
    return res.status(400).json({ error: 'Missing username parameter' });
  }

  try {
    // check if the username already exists in the database
    const existingUser = await User.findOne({ where: { username: username } });
    if (existingUser) {
      logger.debug("Username already in use!!");
      return res.status(400).json({ error: `Username '${username}' already exists` });
    }

    // if the username doesn't exist, create a new user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      first_name,
      last_name,
      password: hashedPassword,
      username
    });

    const { password: _hashedPassword, ...userWithoutPassword } = newUser.toJSON();
    res.status(201).json({
      message: `User ${first_name} ${last_name} added successfully`,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});




app.get("/v1/user/:id", async (req, res) => {
  statsClient.increment('systemname.subsystem.get_user_api');
  logger.debug("Get User API Hit");
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(
    decoded.indexOf(":") + 1,
    decoded.length
  );
  try {
    const user = await User.findOne({
      where: { username }
    });
    if (!user) {
      logger.debug("Wrong username");
      return res.status(401).json({error: "Unauthorized"});
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.debug("Wrong password");
      return res.status(401).json({error: "Unauthorized"});
    }
    const id = req.params.id;
    const userDetails = await User.findOne({
      where: { id },
      attributes: {
        exclude: ['password']
      }
    });
    if (!userDetails) {
      logger.debug("No user with the user ID found");
      return res.status(400).json({error: "No user with the user ID found"});
    }
    return res.json(userDetails);
  } catch (err) {
    console.log(err);
    logger.debug("User not found");
    return res.status(500).json({error: "User not found"});
  }
});

/*

app.delete("/v1/product/:id", async (req, res) => {
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(
    decoded.indexOf(":") + 1,
    decoded.length
  );

  try {
    const user = await User.findOne({
      where: { username }
    });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const product = await Product.findOne({
      where: { id: req.params.id, owner_user_id: user.userid }
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    await product.destroy();
    return res.json({ message: `${product.name} Deleted` });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error while deleting the product" });
  }
});
*/



// Delete Product Recent 16-March-2023
app.delete("/v1/product/:id", async (req, res) => {
  statsClient.increment('systemname.subsystem.delete_product_api');
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(
    decoded.indexOf(":") + 1,
    decoded.length
  );
  const productId = req.params.id;

  try {
    const user = await User.findOne({
      where: { username }
    });
    if (!user) {
      logger.debug("Wrong username");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.debug("Wrong Password");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const product = await Product.findOne({
      where: { id: productId, owner_user_id: user.id }
    });
    if (!product) {
      logger.debug("Product not found with the given owner product ID");
      return res.status(404).json({
        
        error: "Product not found with the given owner product ID."
      });
    }
    await product.destroy();
    return res.json({ message: `${product.name} Deleted` });
  } catch (err) {
    console.log(err);
    logger.debug("Error in deleting product");
    return res.status(500).json({ error: "Error deleting product" });
  }
});



// Update Product Account Information USING PUT
app.put("/v1/product/:id", async (req, res) => {
  statsClient.increment('systemname.subsystem.update_product_api');
  logger.debug("Update Product API hit w/ PUT!!! ");
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(
    decoded.indexOf(":") + 1,
    decoded.length
  );
  const id = req.params.id;
  const { name, description, sku, manufacturer, quantity } = req.body;

  // Check for missing fields
  const missingFields = [];
  if (!name) {
    missingFields.push("name");
  }
  if (!description) {
    missingFields.push("description");
  }
  if (!sku) {
    missingFields.push("sku");
  }
  if (!manufacturer) {
    missingFields.push("manufacturer");
  }
  if (!quantity) {
    missingFields.push("quantity");
  }
  if (missingFields.length > 0) {
    const errorMessage = missingFields.map(field => `${field} is missing`).join(", ");
    return res.status(400).json({ error: errorMessage });
  }

  try {
    const user = await User.findOne({
      where: { username }
    });
    if (!user) {
      logger.debug("Wrong Username");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.debug("Wrong Password!!");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const product = await Product.findOne({
      where: { id, owner_user_id: user.id }
    });
    if (!product) {
      logger.debug("No product found with the given product ID.");
      return res.status(404).json({
        message: "No product found with the given product ID."
      });
    }
    product.name = name;
    product.description = description;
    product.sku = sku;
    product.manufacturer = manufacturer;
    product.quantity = quantity;
    await product.save();

    return res.status(200).json({ product });
  } catch (err) {
    console.log(err);
    logger.debug("Product not found");
    return res.status(500).json({ error: "Product not found" });
  }
});




// Update Product Account Information USING PATCH
app.patch("/v1/product/:id", async (req, res) => {
  statsClient.increment('systemname.subsystem.update_product_patch_api');
  logger.debug("Update Product API hit w/ PATCH!!!");
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(
    decoded.indexOf(":") + 1,
    decoded.length
  );
  const id = req.params.id;

  try {
    const user = await User.findOne({
      where: { username }
    });
    if (!user) {
      logger.debug("Wrong Username!!!");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.debug("Wrong Password!!!");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const product = await Product.findOne({
      where: { id, owner_user_id: user.id }
    });
    if (!product) {
      logger.debug("Product not found or you don't have the permission to edit this product!!!");
      return res.status(400).json({error: "Product not found or you don't have the permission to edit this product"});
    }
    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;
    if (req.body.sku) product.sku = req.body.sku;
    if (req.body.manufacturer) product.manufacturer = req.body.manufacturer;
    if (req.body.quantity) product.quantity = req.body.quantity;

    await product.save();

    return res.json(product);
  } catch (err) {
    console.log(err);
    logger.debug("Error updating product");
    return res.status(500).json({error: "Error updating product"});
  }
});



// Update User Account Information
app.put("/v1/user/:id", async (req, res) => {
  statsClient.increment('systemname.subsystem.update_user_api');
  logger.debug("Update user details API Hit!!");
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(
  decoded.indexOf(":") + 1,
  decoded.length
  );
  const id = req.params.id;
  const { first_name, last_name, password: newPassword, username: newUsername } = req.body;
  try {
  const user = await User.findOne({
  where: { id }
  });
  if (!user) {
  logger.debug("Wrong Username!!!");
  return res.status(401).json({ error: "Unauthorized" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.debug("Wrong Password!!!");
  return res.status(401).json({ error: "Unauthorized" });
  }
  user.username = newUsername;
  user.first_name = first_name;
  user.last_name = last_name;
  user.password = await bcrypt.hash(newPassword, 10);
  
  await user.save();
  
  return res.json({
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
  });
  
  } catch (err) {
  console.log(err);
  logger.debug("Username not found, Try Again!!!");
  return res.status(500).json({ error: "User not found" });
  }
  });

  //Add Product
  app.post("/v1/product", async (req, res) => {
    statsClient.increment('systemname.subsystem.post_product_api');
    logger.debug("Add Product API Hit!!!");
    const decoded = decodeBase64(req);
    const username = decoded.substring(0, decoded.indexOf(":"));
    const password = decoded.substring(
    decoded.indexOf(":") + 1,
    decoded.length
    );
  
    if (!req.body.name) {
      logger.debug("Name parameter is missing!!!");
      return res.status(400).json({ error: "name parameter is missing" });
    }
    if (!req.body.description) {
      logger.debug("Description parameter is missing!!!");
      return res.status(400).json({ error: "description parameter is missing" });
    }
    if (!req.body.sku) {
      logger.debug("SKU parameter is missing!!!");
      return res.status(400).json({ error: "sku parameter is missing" });
    }
    if (!req.body.manufacturer) {
      logger.debug("Manufacturer parameter is missing!!!");
      return res.status(400).json({ error: "manufacturer parameter is missing" });
    }
    if (!req.body.quantity) {
      logger.debug("Quantity parameter is missing!!!");
      return res.status(400).json({ error: "quantity parameter is missing" });
    }
  
    try {
      const user = await User.findOne({
        where: { username }
      });
      if (!user) {
        logger.debug("Wrong Username!!!");
        return res.status(401).json({error: "Unauthorized"});
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.debug("Wrong Password!!!");
        return res.status(401).json({error: "Unauthorized"});
      }
  
      const quantity = parseFloat(req.body.quantity);
      if (isNaN(quantity) || !Number.isInteger(quantity)) {
        logger.debug("Please input the quantity in numerical format");
        return res.status(400).json({ error: "Please input the quantity in numerical format" });
      }
  
      if (quantity > 100) {
        logger.debug("Quantity cannot exceed 100");
        return res.status(400).json({ error: "Quantity cannot exceed 100" });
      }

      // check if the sku is already present
      const existingProduct = await Product.findOne({ where: { sku: req.body.sku } });
      if (existingProduct) {
        logger.debug("SKU is already present, Try different SKU!!!");
        return res.status(400).json({ error: `SKU ${req.body.sku} is already present` });
      }
  
      const product = await Product.create({
        name: req.body.name,
        description: req.body.description,
        sku: req.body.sku,
        manufacturer: req.body.manufacturer,
        quantity: req.body.quantity,
        date_added: new Date(),
        date_last_updated: new Date(),
        owner_user_id: user.id
      });
      return res.status(201).json({
        message: `${product.name} added successfully`,
        product: product
      });
    } catch (err) {
      console.log(err);
      logger.debug("Error while creating the product");
      return res.status(500).json({error: "Error while creating the product"});
    }
  });
  


//Get Product
app.get("/v1/product/:id", async(req, res) => {
  statsClient.increment('systemname.subsystem.get_product_api');
  logger.debug("Fetch Product API Hit!!!");
  const id = req.params.id
  try {
    const product = await Product.findOne({
      where: { id }
    });
    if (product) {
      res.status(200).json({ product });
    } else {
      res.status(404).json({ message: 'No product found with the given owner user ID.' });
    }
  } catch (err) {
    console.log(err)
    logger.debug("Product not found");
    return res.status(500).json({error: "Product not found"})
  }
});



  
app.listen(5000, async () => {
    console.log("Server on port 5000");
    await sequelize.sync({ force: true });
});


//ITREATIONS OF BAD CODE:

// Get User Account Information
/*app.get("/v1/user/:uuid", async(req, res) => {
  const uuid = req.params.uuid
  try {
    const user = await User.findOne({
      where: { uuid }
    })
    return res.json(user)
  } catch (err) {
    console.log(err)
    return res.status(500).json({error: "User not found"})

  }
})
*/


/* WORKING POST API WITHOUT AUTH
app.post('/v1/product', async(req, res) => {
  Product.create({
    name: req.body.name,
    description: req.body.description,
    sku: req.body.sku,
    manufacturer: req.body.manufacturer,
    quantity: req.body.quantity,
    date_added: new Date(),
    date_last_updated: new Date(),
    owner_user_id: req.body.owner_user_id,
  })
    .then(product => {
      res.status(201).json({
        message: `${product.name} added successfully`,
        product: product
      });
    })
    .catch(error => {
      res.status(500).json({
        error: error
      });
    });
});


MOST RECENT FAILED POST PRODUCT 19:17
app.post('/v1/product', async(req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Unauthorized" });
  
  const decoded = decodeBase64(header);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(decoded.indexOf(":") + 1, decoded.length);
  
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Unauthorized" });
    
    Product.create({
      name: req.body.name,
      description: req.body.description,
      sku: req.body.sku,
      manufacturer: req.body.manufacturer,
      quantity: req.body.quantity,
      date_added: new Date(),
      date_last_updated: new Date(),
      owner_user_id: req.body.owner_user_id,
    })
      .then(product => {
        res.status(201).json({
          message: `${product.name} added successfully`,
          product: product
        });
      })
      .catch(error => {
        res.status(500).json({ error });
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "User not found" });
  }
});

 */

// Update User Account Information
/*app.put("/v1/user/:uuid", async(req, res) => {
  const uuid = req.params.uuid
  const {first_name, last_name, password, username } =req.body
  try {
    const user = await User.findOne({
      where: { uuid }
    })
    user.username = username
    user.first_name = first_name
    user.last_name = last_name
    user.password = password
    
    await user.save()

    return res.json(user)
  } catch (err) {
    console.log(err)
    return res.status(500).json({error: "User not found"})

  }
})
*/







/*app.post('/v1/product', async(req, res) => {
  const {name, description , sku,
    manufacturer, quantity, owner_product_id } = req.body
  try{
    const user = await User.findOne({where: { uuid: owner_product_id } })
    const product = await Product.create({name, description , sku,
      manufacturer, quantity, UserId: user.id})
      return res.json(product)
  } catch (err){
    console.log(err) 
    return res.status(500).json(err)
  }

})
*/

/*app.post('/v1/product', async (req, res) => {
  const { name, description, sku, manufacturer, quantity, owner_product_id } = req.body;
  
  try {
    const user = await User.findOne({ where: { uuid: owner_product_id } });
    const product = await Product.create({
      name,
      description,
      sku,
      manufacturer,
      quantity,
      UserId: user.id
    });
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
  
    return res.status(201).json(product);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});
*/

/*
//Fetch Product Details
app.get('/v1/product/:owner_user_id', async (req, res) => {
  Product.findOne({ owner_user_id: req.params.owner_user_id })
  .then(product => {
  if (product) {
  res.status(200).json({
  product: product
  });
  } else {
  res.status(404).json({
  message: "No product found with the given owner user ID."
  });
  }
  })
  .catch(error => {
  res.status(500).json({
  error: error
  });
  });
  });
*/





const { Image } = require("../models");
const dotenv = require('dotenv');
//dotenv.config({ path: '../.env' });


const AWS = require("aws-sdk");
const multer = require("multer");
const upload = multer({ dest: "/home/ec2-user/scripts/webApp/uploads/" });
const s3 = new AWS.S3({});
const fs = require("fs");

//Upload Product Image
app.post("/v1/product/:product_id/image", upload.single("image"), async (req, res) => {
  statsClient.increment('systemname.subsystem.post_product_image_api');
  logger.debug("Upload Image API Hit!!!");
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(decoded.indexOf(":") + 1, decoded.length);
  const productId = req.params.product_id;

  try {
    const user = await User.findOne({
      where: { username },
    });
    if (!user) {
      logger.debug("Wrong Username!!!");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.debug("Wrong Password!!!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // check if the product exists
    const product = await Product.findOne({ where: { id: productId } });
    if (!product) {
      logger.debug("Product with given product id was not found!!!");
      return res.status(404).json({ error: `Product with ID ${productId} not found` });
    }

    // check if the user owns the product
    if (product.owner_user_id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // check if an image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    
    // check if the file has the correct extension
    const fileExtension = path.extname(req.file.originalname);
    if (![".jpg", ".jpeg", ".png", ".gif"].includes(fileExtension.toLowerCase())) {
      logger.debug("Unsupported File Type, Supported Filetypes are .jpeg, .jpg, .png, .gif");
      return res.status(400).json({ error: "Unsupported File Type" });
    }


    // upload the image to S3
    const timestamp = new Date().getTime();
    const imageKey = `product-images/${product.id}/${timestamp}-${req.file.originalname}`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: imageKey,
      Body: fs.createReadStream(req.file.path),
      ContentType: req.file.mimetype,
    };
    const result = await s3.upload(params).promise();

    // update the product with the image URL and image key
    product.image_url = result.Location;
    product.date_last_updated = new Date();
    product.image_key = imageKey; // add the image key to the product record
    await product.save();

    // create a new image record in the database
    const image = await Image.create({
      product_id: product.id,
      s3_bucket_path: result.Location,
      image_key: imageKey // add the imageKey to the image record
    });

    return res.status(200).json({
      message: `Image for product ${product.name} added successfully`,
      image_id: image.id,
      s3_bucket_path: image.s3_bucket_path,
      image_key: image.image_key,
      created_at: image.createdAt,
      updated_at: image.updatedAt,
    });
  } catch (err) {
    console.log(err);
    logger.debug("Error while adding product image");
    return res.status(500).json({ error: "Error while adding product image" });
  }
});


//Delete Product Image
app.delete("/v1/product/:productId/image/:imageId", async (req, res) => {
  statsClient.increment('systemname.subsystem.delete_product_image_api');
  logger.debug("Delete Product Image API Hit!!!");
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(decoded.indexOf(":") + 1, decoded.length);
  const productId = req.params.productId;
  const imageId = req.params.imageId;
  const timestamp = new Date().getTime();
  try {
    const user = await User.findOne({
      where: { username },
    });
    if (!user) {
      logger.debug("Wrong Username!!");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.debug("Wrong Password!!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // check if the product exists
    const product = await Product.findOne({ where: { id: productId } });
    if (!product) {
      logger.debug("Product with given product ID was not found!!!");
      return res.status(404).json({ error: `Product with ID ${productId} not found` });
    }

    // check if the user owns the product
    if (product.owner_user_id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // check if the image exists
    const image = await Image.findOne({ where: { id: imageId, product_id: productId } });
    if (!image) {
      return res.status(404).json({ error: `Image with ID ${imageId} not found for product ${product.name}` });
    }

    // delete the image from S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: image.image_key,
    };
    s3.deleteObject(params, (err, data) => 
    {
      if (err) { console.log(err); } else { console.log(data); }});
    
    //await s3.deleteObject(params).promise();
    logger.debug("Product Image deleted successfully!!!");
    console.log(`Object with key ${params.Key} deleted successfully from bucket ${params.Bucket}`);

    // delete the image record from the database
    await image.destroy();
    logger.debug("Image Delted from Database!!!");
    console.log(`Image record with ID ${imageId} destroyed successfully`);

    return res.status(200).json({ message: `Image with ID ${imageId} deleted successfully` });
  } catch (err) {
    logger.debug("Error while deleting product image");
    console.log(`Error deleting image with ID ${imageId}`, err);
    return res.status(500).json({ error: "Error while deleting product image" });
  }
});



//GET only 1 product Image 

app.get("/v1/product/:product_id/image/:image_id", async (req, res) => {
  statsClient.increment('systemname.subsystem.get_product_image_api_id');
  logger.debug("GET only 1 product Image API Hit!!");
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(decoded.indexOf(":") + 1, decoded.length);
  const productId = req.params.product_id;
  const imageId = req.params.image_id;

  try {
    const user = await User.findOne({
      where: { username },
    });
    if (!user) {
      logger.debug("Wrong Username!!");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.debug("Wrong Password!!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // check if the product exists
    const product = await Product.findOne({ where: { id: productId } });
    if (!product) {
      logger.debug("Product with given product ID does not exist!!");
      return res.status(404).json({ error: `Product with ID ${productId} not found` });
    }

    // check if the user owns the product
    if (product.owner_user_id !== user.id) {
      logger.debug("User does not owns the product!!");
      return res.status(403).json({ error: "Forbidden" });
    }

    // check if the image exists
    const image = await Image.findOne({ where: { id: imageId, product_id: productId } });
    if (!image) {
      logger.debug("Image ID is not associated with this product ID!!");
      return res.status(404).json({ error: `Image with ID ${imageId} not found for product ${product.name}` });
    }

    return res.status(200).json({ image });
  } catch (err) {
    console.log(err);
    logger.debug("Error while fetching product image!!");
    return res.status(500).json({ error: "Error while fetching product image" });
  }
});

// GET all the images of the product

app.get("/v1/product/:product_id/image", async (req, res) => {
  statsClient.increment('systemname.subsystem.get_product_image_api_many');
  logger.debug("GET All product Image API Hit!!");
  const decoded = decodeBase64(req);
  const username = decoded.substring(0, decoded.indexOf(":"));
  const password = decoded.substring(decoded.indexOf(":") + 1, decoded.length);
  const productId = req.params.product_id;

  try {
    const user = await User.findOne({
      where: { username },
    });
    if (!user) {
      logger.debug("Wrong Username!!");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.debug("Wrong Password!!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // check if the product exists
    const product = await Product.findOne({ where: { id: productId } });
    if (!product) {
      logger.debug("Product with given product ID is not found!!");
      return res.status(404).json({ error: `Product with ID ${productId} not found` });
    }

    // check if the user owns the product
    if (product.owner_user_id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // get all images associated with the product
    const images = await Image.findAll({ where: { product_id: productId } });

    return res.status(200).json(images);
  } catch (err) {
    console.log(err);
    logger.debug("Error while retrieving product images!!");
    return res.status(500).json({ error: "Error while retrieving product images" });
  }
});
