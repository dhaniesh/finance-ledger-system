import express from "express"
import type { Request, Response } from "express"
import { prismaClient } from "./db"
import { Prisma } from "../generated/prisma/client"
import { CreateTransactionSchema } from "./types"

const PORT = 3000;
const app = express()

app.use(express.json())

app.post("/transactions", async (req: Request, res: Response) => {
    const { success, data, error } = CreateTransactionSchema.safeParse(req.body)
    if (!success) {
        res.status(400).json({ "success": false, error: JSON.parse(error.message) })
    }
    else {
        try {
            return await prismaClient.$transaction(async (tx) => {
                const transaction = await tx.transaction.create({
                    data: { reference: data.reference }
                });
                await tx.ledgerEntry.createMany({
                    data: data.entries.map((e) => ({
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

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})