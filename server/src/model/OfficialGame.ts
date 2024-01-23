import { DataTypes, Sequelize } from "sequelize";

export const OfficialGameModel = (sequelize: Sequelize) => {
    return sequelize.define('officialgame',{
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        image: DataTypes.STRING,
        price: DataTypes.INTEGER
    })
}