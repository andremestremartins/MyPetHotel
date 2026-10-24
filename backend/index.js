import express from "express";
import animaisRoutes from "./routes/animais.routes.js";
import cors from "cors";

const app = express(); 

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({name:"Petsco"})
})

app.use("/api/animais", animaisRoutes);

app.listen(3000, () => {
  console.log("http://localhost:3000");
}); 