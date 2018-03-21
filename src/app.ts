import express from "express";
import metric from "./metric";

const app = express();

app.use("/", (req, res, next) => {
    res.json(metric());
});

export { app };
export default app;
