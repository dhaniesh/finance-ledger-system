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
            console.error("Error creating transaction, Error:", err);
        }
    }
})

app.post("/transactions/:id/reverse", async (req: Request, res: Response) => {
    const transactionId = req.params.id;
    if (!transactionId) {
        res.status(400).json({ "success": false, error: "Missing transaction id" })
    }
    else {
        try {
            return await prismaClient.$transaction(async (tx) => {
                // fetch original transactions with entries
                const originalTx = await tx.transaction.findUnique({
                    where: { id: transactionId as string },
                    include: { entries: true }
                })
                if (!originalTx) {
                    res.status(400).json({ "success": false, error: "Transaction not found" })
                    return;
                }
                if (originalTx?.status === "REVERSED") {
                    res.status(400).json({ "success": false, error: "Transaction already reversed" })
                    return;
                }
                // create reverse transactions
                const reveralReference = `reversal_of_${originalTx.id}`
                const reverseTx = await tx.transaction.create({
                    data: { reference: reveralReference }
                })
                // create reverse ledger entries
                await tx.ledgerEntry.createMany({
                    data: originalTx.entries.map((entry) => ({
                        transactionId: reverseTx.id,
                        accountId: entry.accountId,
                        amount: entry.amount.mul(-1)
                    }))
                });
                // mark original transaction as reversed
                await tx.transaction.update({
                    where: { id: originalTx.id },
                    data: { status: "REVERSED" }
                })
                return {
                    originalTransactionId: originalTx.id,
                    reversalTransactionId: reverseTx.id
                };
            })
        }
        catch (err) {
            console.error("Error reversing transaction, Error:", err);
        }
    }
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