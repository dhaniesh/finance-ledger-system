import express from "express"
import type { Request, Response } from "express"
import { prismaClient } from "./db"
import { Prisma } from "../generated/prisma/client"
import { CreateTransactionSchema } from "./types"

const PORT = 3000;
const app = express()

app.use(express.json())

app.post("/transactions", async (req: Request, res: Response) => {
    const input = CreateTransactionSchema.parse(req.body)
    try {
        return await prismaClient.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: { reference: input.reference }
            });
            await tx.ledgerEntry.createMany({
                data: input.entries.map((e) => ({
                    transactionId: transaction.id,
                    accountId: e.accountId,
                    amount: new Prisma.Decimal(e.amount)
                }))
            });
            return transaction;
        })
    }
    catch (err) {
        console.error("Error creating transaction:", err);
    }
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