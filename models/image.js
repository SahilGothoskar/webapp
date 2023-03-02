'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Product, {foreignKey: 'product_id', targetKey: 'id'})
    }
  }
  Image.init({
    product_id:{ 
    type: DataTypes.INTEGER,
    allowNull: false
  },
    s3_path: {
    type:  DataTypes.STRING,
    allowNull: false
  },
  image_key:{
    type: DataTypes.STRING,
  }
  ,
  }, {
    sequelize,
    tableName: 'image',
    modelName: 'Image',
  });
  return Image;
};
