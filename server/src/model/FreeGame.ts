import { DataTypes, Sequelize } from "sequelize";

export const FreeGameModel = (sequelize: Sequelize) => {
    return sequelize.define('freegame', {
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        image: DataTypes.STRING,
    });
}