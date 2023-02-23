const bcrypt = require('bcrypt');
const { sequelize, User, Product } = require('../models');
const express = require('express');
const { json } = require('sequelize');
const app = express();

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
    res.status(200).json("server responds with 200 OK if it is healhty.", 200);
  } catch (err) {
    res.json(err.message);
  }
});


app.post('/v1/user', async (req, res) => {
  const { first_name, last_name, password, username } = req.body;

  if (!first_name || !last_name || !password || !username) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  User.create({
    first_name,
    last_name,
    password: hashedPassword,
    username
  })
  .then(user => {
    // exclude password field entirely from the user object
    const { password, ...userWithoutPassword } = user.toJSON();
    res.status(201).json({
      message: `User ${first_name} ${last_name} added successfully`,
      user: userWithoutPassword
    });
  })
  .catch(error => {
    res.status(500).json({
      error: error
    });
  });
});



app.get("/v1/user/:id", async (req, res) => {
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
      return res.status(401).json({error: "Unauthorized"});
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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
      return res.status(400).json({error: "No user with the user ID found"});
    }
    return res.json(userDetails);
  } catch (err) {
    console.log(err);
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



// Delete User Account Information
app.delete("/v1/product/:id", async (req, res) => {
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
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const product = await Product.findOne({
      where: { id: productId, owner_user_id: user.id }
    });
    if (!product) {
      return res.status(404).json({
        error: "Product not found with the given owner product ID."
      });
    }
    await product.destroy();
    return res.json({ message: `${product.name} Deleted` });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error deleting product" });
  }
});



// Update Product Account Information USING PUT
app.put("/v1/product/:id", async (req, res) => {
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
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const product = await Product.findOne({
      where: { id, owner_user_id: user.id }
    });
    if (!product) {
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
    return res.status(500).json({ error: "Product not found" });
  }
});




// Update Product Account Information USING PATCH
app.patch("/v1/product/:id", async (req, res) => {
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
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const product = await Product.findOne({
      where: { id, owner_user_id: user.id }
    });
    if (!product) {
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
    return res.status(500).json({error: "Error updating product"});
  }
});



// Update User Account Information
app.put("/v1/user/:id", async (req, res) => {
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
  return res.status(401).json({ error: "Unauthorized" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
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
  return res.status(500).json({ error: "User not found" });
  }
  });

  app.post("/v1/product", async (req, res) => {
    const decoded = decodeBase64(req);
    const username = decoded.substring(0, decoded.indexOf(":"));
    const password = decoded.substring(
    decoded.indexOf(":") + 1,
    decoded.length
    );
  
    if (!req.body.name) {
      return res.status(400).json({ error: "name parameter is missing" });
    }
    if (!req.body.description) {
      return res.status(400).json({ error: "description parameter is missing" });
    }
    if (!req.body.sku) {
      return res.status(400).json({ error: "sku parameter is missing" });
    }
    if (!req.body.manufacturer) {
      return res.status(400).json({ error: "manufacturer parameter is missing" });
    }
    if (!req.body.quantity) {
      return res.status(400).json({ error: "quantity parameter is missing" });
    }
  
    try {
      const user = await User.findOne({
        where: { username }
      });
      if (!user) {
        return res.status(401).json({error: "Unauthorized"});
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({error: "Unauthorized"});
      }
  
      const quantity = parseFloat(req.body.quantity);
      if (isNaN(quantity) || !Number.isInteger(quantity)) {
        return res.status(400).json({ error: "Please input the quantity in numerical format" });
      }
  
      if (quantity > 100) {
        return res.status(400).json({ error: "Quantity cannot exceed 100" });
      }

      // check if the sku is already present
      const existingProduct = await Product.findOne({ where: { sku: req.body.sku } });
      if (existingProduct) {
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
      return res.status(500).json({error: "Error while creating the product"});
    }
  });
  



app.get("/v1/product/:id", async(req, res) => {
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





