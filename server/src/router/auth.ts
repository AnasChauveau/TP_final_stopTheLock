import { Router } from "express";
import { TokenBlackList, User } from "..";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { DecodeToken, checkToken } from "../middlewares/checkToken";

export const authRouter = Router();

authRouter.post("/local/register", async (req, res) => {
    // const username = req.body.username;
    // const password = req.body.password;
    // const email = req.body.email;

    const { username, password, email } = req.body;
    const userWithEmail = await User.findOne({ where: { email } });
    if (userWithEmail) {
        res.status(400).json("Email already exists");
    }
    else {
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS!));
        const newUser = await User.create({ username, password: hashedPassword, email });
        delete newUser.dataValues.password;
        res.json(newUser);
    }
});

authRouter.post("/local", async (req, res) => {
    const { identifier, password } = req.body;
    const userWithEmail = await User.findOne({ where: { email: identifier } });
    if (!userWithEmail) {
        res.status(400).json("Email or Password is incorrect");
    }
    else {
        const isPasswordCorrect = await bcrypt.compare(password, userWithEmail.dataValues.password);
        if (isPasswordCorrect) {
            delete userWithEmail.dataValues.password;
            const token = jwt.sign(userWithEmail.dataValues, process.env.JWT_SECRET!);
            res.json({
                token,
                ...userWithEmail.dataValues
            });
        }
        else {
            res.status(400).json("Email or Password is incorrect");
        }
    }
})

authRouter.post("/change-password", checkToken, async (req, res) => {
    const { currentPassword, passwordConfirmation, password } = req.body;
    if (passwordConfirmation !== password) {
        res.status(400).json("New passwords do not match");
    }
    else if(passwordConfirmation.length < 6){
        res.status(400).json("New password must be at least 6 characters long")
    }
    else {
        const decoded = jwt.decode(req.token!) as DecodeToken
        const user = await User.findOne({ where: { id: decoded.id } });
        if (user) {
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.dataValues.password);
            if (isPasswordCorrect) {
                const hashedPassword = await bcrypt.hash(passwordConfirmation, parseInt(process.env.SALT_ROUNDS!));
                await user.update({ password: hashedPassword });
                res.json("Password changed");
            }
            else {
                res.status(400).json("Current password is incorrect");
            }
        }
        else {
            res.status(404).json("User not found");
        }
    }
})

authRouter.post("/logout", checkToken, async (req, res) => {
    const decoded = jwt.decode(req.token!) as DecodeToken
    const user = await User.findOne({ where: { id: decoded.id } });
    if (user) {
        await TokenBlackList.create({ token: req.token });
        res.json("Logged out");
    }
    else {
        res.status(404).json("User not found");
    }
})