'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Image }) {
      // define association here
      this.belongsTo(User, {foreignKey: 'owner_user_id', targetKey: 'id'})
    }


  }
  product.init({
    name: { 
      type: DataTypes.STRING,
      allowNull: false
      },
    description: { 
      type: DataTypes.STRING,
      allowNull: false
      },
      sku: { 
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isUnique: function(value, next) {
            product.findOne({
              where: {sku: value},
              attributes: ['id']
            }).then(function(product) {
              if (product) {
                return next('SKU already assigned to a product');
              }
              return next();
            }).catch(function(err) {
              return next(err.message);
            });
          }
        }
      },
    manufacturer: { 
      type: DataTypes.STRING,
      allowNull: false
      },
      quantity: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: function(value) {
            if (!Number.isInteger(value)) {
              throw new Error('Quantity must be a whole number');
            }
          },
          min: function(value) {
            if (value <= 0) {
              throw new Error('Quantity must be greater than 0');
            }
          }
        }
      },
    owner_user_id: { 
      type: DataTypes.INTEGER,
      defaultValue: DataTypes.INTEGER,
      allowNull: false
      },
  }, {
    sequelize,
    tableName: 'product',
    modelName: 'Product'
  });
  return product;
};
