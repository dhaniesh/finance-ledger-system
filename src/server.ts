import express from "express"
import type { Request, Response } from "express"
import { prismaClient } from "./db"

const PORT = 3000;
const app = express()

app.use(express.json())

app.post("/transactions", (req: Request, res: Response) => {
    res.json();
})

app.post("/transactions/:id/reverse", (req: Request, res: Response) => {
    res.json();
})

app.get("/accounts/:id/balance", (req: Request, res: Response) => {
    res.json();
})

app.get("/accounts/:id/entries", (req: Request, res: Response) => {
    res.json();
})

app.listen(() => {
    console.log(`Listening on port ${PORT}`)
})