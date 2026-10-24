import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        mensagem: "Rota de animais a funcionar!"
    });
});

export default router;