import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const response = await fetch(
      "https://webhook.versell.tech/webhook/6dd35f41-1041-4da1-a0c3-0bdf2ac4e341",
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

    // Filtra apenas datas com dados válidos (count > 0)
    const filteredData = rawData
      .filter((item: { count: number; date: string }) => {
        return item.count > 0;
      })
      .map((item: { date: string; count: number; amount: number }) => {
        // Count dividido por 2, arredondado para inteiro
        const transactionCount = Math.floor(item.count / 2);
        // Valor total dividido por 2
        const totalValue = item.amount / 2;

        // Define a data de corte para mudança de taxa
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        const cutoffDate = new Date('2025-11-03');
        cutoffDate.setHours(0, 0, 0, 0);

        // Aplica taxa de 0.50 a partir de 03/11/2025, senão 0.37
        const rate = itemDate >= cutoffDate ? 0.50 : 0.37;
        const calculatedAmount = transactionCount * rate;

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
