import { z } from "zod";
import { Prisma } from "../generated/prisma/client";

const LedgerEntrySchema = z.object({
    accountId: z.uuid(),
    amount: z.string()
})

export const CreateTransactionSchema = z.object({
    reference: z.string().min(1),
    entries: z.array(LedgerEntrySchema).min(2)
})
    .refine((data) => {
        const sum = data.entries.reduce((total, entry) => total.add(new Prisma.Decimal(entry.amount)), new Prisma.Decimal(0))
        return sum;
    }, {
        message: "Ledger entries must balance to zero"
    })

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>