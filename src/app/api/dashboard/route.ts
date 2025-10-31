import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const response = await fetch(
      "https://webhook.versell.tech/webhook/518c669d-4254-4121-b335-aff04543ca2d",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(`API returned status: ${response.status}`);
      const text = await response.text();
      console.error("Response body:", text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();
    console.log("Data fetched successfully:", rawData);

    // Pega a data de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filtra apenas datas com dados válidos (count > 0) e a partir de hoje (inclusive datas futuras)
    const filteredData = rawData
      .filter((item: { count: number; date: string }) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return item.count > 0 && itemDate <= today;
      })
      .map((item: { date: string; count: number; amount: number }) => {
        // Count dividido por 2
        const transactionCount = item.count / 2;
        // Valor total dividido por 2
        const totalValue = item.amount / 2;
        // Aplica a fórmula: (count / 2) * 0.37
        const calculatedAmount = transactionCount * 0.37;

        return {
          data_transacao: new Date(item.date).toLocaleDateString('pt-BR'),
          total_transacoes: transactionCount.toString(),
          valor_total: totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          lucro_total: calculatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        };
      })
      .reverse(); // Inverte para mostrar do mais recente para o mais antigo

    return NextResponse.json({ data: filteredData });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
