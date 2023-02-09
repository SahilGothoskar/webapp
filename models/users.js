'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Product }) {
      // define association here
      this.hasMany(Product, {foreignKey: 'owner_user_id'} )
    }
/*    
    toJSON(){
      return{ ...this.get(), id: undefined}
    }
  */  
  }
  User.init({

    first_name: { 
    type: DataTypes.STRING,
    allowNull: false
    },
    last_name: { 
      type: DataTypes.STRING,
      allowNull: false
      },
    username: { 
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUsername: function(value) {
          if (!/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/.test(value)) {
            throw new Error('Please enter username in name@provider.org format');
          }
        }
      }

      },
    password: { 
      type: DataTypes.STRING,
      allowNull: false
      },
  }, {
    sequelize,
    tableName: 'users',
    modelName: 'User'
  });
  return User;
};