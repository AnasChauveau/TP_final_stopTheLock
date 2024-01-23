import { Router } from "express";
import { FreeGame } from "..";

export const freeGameRouter = Router();

freeGameRouter.get("/", async (req, res) => {
    const officialGames = await FreeGame.findAll();
    res.json(officialGames);
});

freeGameRouter.get("/:id", async (req, res) => {
    const officialGame = await FreeGame.findOne({ where: { id: req.params.id } });
    if (officialGame) {
        res.json(officialGame);
    }
    else {
        res.status(404).send("Game not found");
    }
});

freeGameRouter.post("/", async (req, res) => {
    const { name, description, image } = req.body.data;
    if(!name || !description || !image){
        res.status(400).send("Missing required information");
    }
    else {
        const newOfficialGame = await FreeGame.create({ name, description, image });
        res.json(newOfficialGame);
    }
});

freeGameRouter.put("/:id", async (req, res) => {
    const { name, description, image } = req.body.data;
    const actual = await FreeGame.findOne({ where: { id: req.params.id } });
    if (actual) {
        const newOfficialGame = await actual.update({ name, description, image });
        res.json(actual);
    }
    else {
        res.status(404).send("Game not found");
    }
});

freeGameRouter.delete("/:id", async (req, res) => {
    const actual = await FreeGame.findOne({ where: { id: req.params.id } });
    if (actual) {
        await actual.destroy();
        res.json(actual);
    }
    else {
        res.status(404).send("Game not found");
    }
});