import { prisma } from "@/lib/prisma";
import { getKindLabel, getReasonLabel } from "@/lib/reasons";

export default async function MovementsPage() {
  const movements = await prisma.stockMovement.findMany({
    take: 100,
    orderBy: {
      createdAt: "desc"
    },
    include: {
      employee: {
        select: {
          name: true
        }
      },
      product: {
        select: {
          name: true,
          internalSku: true
        }
      },
      supply: {
        select: {
          destination: true,
          reference: true
        }
      }
    }
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Журнал движений</h1>
        <p className="mt-1 text-sm text-slate-600">
          Последние 100 записей. Именно из них считаются остатки.
        </p>
      </div>

      <div className="space-y-3">
        {movements.map((movement) => (
          <article className="panel p-4" key={movement.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-ink">
                  {movement.product.name}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {movement.product.internalSku} · {getKindLabel(movement.kind)} ·{" "}
                  {getReasonLabel(movement.reason)}
                </div>
              </div>

              <div
                className={
                  movement.quantityDelta >= 0
                    ? "text-right text-lg font-bold text-emerald-700"
                    : "text-right text-lg font-bold text-red-700"
                }
              >
                {movement.quantityDelta > 0 ? "+" : ""}
                {movement.quantityDelta}
              </div>
            </div>

            <div className="mt-3 grid gap-1 text-sm text-slate-600">
              <div>
                {movement.createdAt.toLocaleString("ru-RU", {
                  dateStyle: "short",
                  timeStyle: "short"
                })}
                {movement.employee?.name ? ` · ${movement.employee.name}` : ""}
              </div>
              {movement.supply ? (
                <div>
                  {movement.supply.destination}
                  {movement.supply.reference
                    ? ` · ${movement.supply.reference}`
                    : ""}
                </div>
              ) : null}
              {movement.comment ? <div>{movement.comment}</div> : null}
            </div>
          </article>
        ))}

        {movements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Движений пока нет.
          </div>
        ) : null}
      </div>
    </div>
  );
}
