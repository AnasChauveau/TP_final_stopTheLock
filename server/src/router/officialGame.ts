import { Router } from "express";
import { OfficialGame } from "..";
import { checkToken } from "../middlewares/checkToken";

export const officialGameRouter = Router();

officialGameRouter.get("/", checkToken, async (req, res) => {
    const officialGames = await OfficialGame.findAll();
    res.json(officialGames);
});

officialGameRouter.get("/:id", checkToken, async (req, res) => {
    const officialGame = await OfficialGame.findOne({ where: { id: req.params.id } });
    if (officialGame) {
        res.json(officialGame);
    }
    else {
        res.status(404).send("Game not found");
    }
});

officialGameRouter.post("/", checkToken, async (req, res) => {
    const { name, description, price, image } = req.body.data;
    if(!name || !description || !price || !image){
        res.status(400).send("Missing required information");
    }
    else {
        const newOfficialGame = await OfficialGame.create({ name, description, price, image });
        res.json(newOfficialGame);
    }
});

officialGameRouter.put("/:id", checkToken, async (req, res) => {
    const { name, description, price, image } = req.body.data;
    const actual = await OfficialGame.findOne({ where: { id: req.params.id } });
    if (actual) {
        const newOfficialGame = await actual.update({ name, description, price, image });
        res.json(actual);
    }
    else {
        res.status(404).send("Game not found");
    }
});

officialGameRouter.delete("/:id", checkToken, async (req, res) => {
    const actual = await OfficialGame.findOne({ where: { id: req.params.id } });
    if (actual) {
        await actual.destroy();
        res.send("deleted");
    }
    else {
        res.status(404).send("Game not found");
    }
});