"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface DataItem {
  data_transacao: string;
  total_transacoes: string;
  valor_total: string;
  lucro_total: string;
}

export default function Dashboard() {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deductions, setDeductions] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetchData();
    fetchDeductions();
  }, []);

  const fetchDeductions = async () => {
    try {
      const response = await fetch("/api/deductions");
      const result = await response.json();
      setDeductions(result.total || 0);
    } catch (err) {
      console.error("Erro ao carregar deduções:", err);
      setDeductions(0);
    }
  };

  const fetchData = async () => {
    try {
      // Tenta primeiro a API real
      let response = await fetch("/api/dashboard", {
        cache: 'no-store'
      });
      let result = await response.json();

      // Se falhar, usa os dados mockados
      if (result.error) {
        console.log("API real falhou, usando dados mockados");
        response = await fetch("/api/dashboard/mock");
        result = await response.json();
      }

      setData(result.data);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      // Tenta carregar dados mockados como fallback
      try {
        const response = await fetch("/api/dashboard/mock");
        const result = await response.json();
        setData(result.data);
        setLoading(false);
      } catch {
        setError("Erro ao carregar dados");
        setLoading(false);
      }
    }
  };


  const calculateTotals = () => {
    if (!data || !data.length) return { transacoes: 0, valor: 0, lucro: 0 };

    const totals = data.reduce(
      (acc, item) => {
        // Parse dos valores removendo formatação
        const transacoes = parseInt(item.total_transacoes.replace(/\./g, "")) || 0;
        const valor = parseFloat(item.valor_total.replace(/\./g, "").replace(",", ".")) || 0;
        const lucro = parseFloat(item.lucro_total.replace(/\./g, "").replace(",", ".")) || 0;

        return {
          transacoes: acc.transacoes + transacoes,
          valor: acc.valor + valor,
          lucro: acc.lucro + lucro,
        };
      },
      { transacoes: 0, valor: 0, lucro: 0 }
    );

    console.log('Totais calculados:', totals);
    return totals;
  };

  const totals = calculateTotals();

  const getTodayProfit = () => {
    if (!data || !data.length) return 0;
    // Pega o último item (mais recente) da lista
    const lastItem = data[0];
    return parseFloat(lastItem.lucro_total.replace(/\./g, "").replace(",", "."));
  };

  const todayProfit = getTodayProfit();

  const getTotalBalance = () => {
    // Usa o lucro total calculado do histórico como saldo disponível, menos as deduções
    const balance = totals.lucro - deductions;
    console.log('Cálculo do Saldo:', {
      lucroTotal: totals.lucro,
      deducoes: deductions,
      saldoFinal: balance
    });
    return balance;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const CustomLabel = (props: { x?: number; y?: number; value?: number; index?: number }) => {
    const { x = 0, y = 0, value = 0 } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <rect
          x={-20}
          y={-16}
          width={40}
          height={20}
          rx={4}
          ry={4}
          fill="#3B82F6"
        />
        <text
          x={0}
          y={-2}
          fill="white"
          textAnchor="middle"
          fontSize={11}
          fontWeight="bold"
        >
          {value}
        </text>
      </g>
    );
  };

  const CustomLabelCurrency = (props: { x?: number; y?: number; value?: number; index?: number }) => {
    const { x = 0, y = 0, value = 0 } = props;
    const formattedValue = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    }).format(value);
    const width = formattedValue.length * 6 + 10;
    return (
      <g transform={`translate(${x},${y})`}>
        <rect
          x={-width/2}
          y={-16}
          width={width}
          height={20}
          rx={4}
          ry={4}
          fill="#10B981"
        />
        <text
          x={0}
          y={-2}
          fill="white"
          textAnchor="middle"
          fontSize={11}
          fontWeight="bold"
        >
          {formattedValue}
        </text>
      </g>
    );
  };

  const chartData = data && data.length > 0 ? data.slice().reverse().map(item => ({
    data: item.data_transacao.substring(0, 5),
    transacoes: parseInt(item.total_transacoes.replace(/\./g, "")),
    valor: parseFloat(item.valor_total.replace(/\./g, "").replace(",", ".")),
    lucro: parseFloat(item.lucro_total.replace(/\./g, "").replace(",", "."))
  })) : []

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#101828] flex items-center justify-center">
        <div className="animate-scale-pulse">
          <Image
            src="https://dash.versellpay.com/loading.svg"
            alt="Loading"
            width={100}
            height={100}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101828] flex items-center justify-center">
        <div className="animate-scale-pulse">
          <Image
            src="https://dash.versellpay.com/loading.svg"
            alt="Loading"
            width={100}
            height={100}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#101828] flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101828] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Image
            src="https://app.versellbank.com/assets/versell-logo.svg"
            alt="Versell Logo"
            width={150}
            height={40}
          />
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await fetchData();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className={`bg-[#354153] hover:bg-[#4A5568] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1D2A39] rounded-lg p-6 border border-[#354153]">
            <p className="text-gray-400 text-sm mb-2">Total de Transações</p>
            <p className="text-3xl font-bold text-white">
              {formatNumber(totals.transacoes)}
            </p>
          </div>

          <div className="bg-[#1D2A39] rounded-lg p-6 border border-[#354153]">
            <p className="text-gray-400 text-sm mb-2">Valor Total Transacionado</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(totals.valor)}
            </p>
          </div>

          <div className="bg-[#1D2A39] rounded-lg p-6 border border-[#354153]">
            <p className="text-gray-400 text-sm mb-2">Lucro de Hoje</p>
            <p className="text-3xl font-bold text-blue-400">
              {formatCurrency(todayProfit)}
            </p>
          </div>

          <div className="bg-[#1D2A39] rounded-lg p-6 border border-[#354153]">
            <p className="text-gray-400 text-sm mb-2">Valores Pagos</p>
            <p className="text-3xl font-bold text-green-400">
              {formatCurrency(deductions)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#1D2A39] rounded-lg p-6 border border-[#354153]">
            <h2 className="text-xl font-bold text-white mb-4">Evolução das Transações</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTransacoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#354153" />
                <XAxis dataKey="data" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1D2A39', border: '1px solid #354153' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="transacoes"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorTransacoes)"
                  name="Transações"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  label={<CustomLabel />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#1D2A39] rounded-lg p-6 border border-[#354153]">
            <h2 className="text-xl font-bold text-white mb-4">Evolução do Lucro</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#354153" />
                <XAxis dataKey="data" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1D2A39', border: '1px solid #354153' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="lucro"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorLucro)"
                  name="Lucro (R$)"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  label={<CustomLabelCurrency />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1D2A39] rounded-lg p-6 border border-[#354153] overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-4">
            Histórico de Transações
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#354153]">
                <th className="text-left text-gray-400 py-3 px-4">Data</th>
                <th className="text-right text-gray-400 py-3 px-4">
                  Transações
                </th>
                <th className="text-right text-gray-400 py-3 px-4">
                  Valor Total Transacionado
                </th>
                <th className="text-right text-gray-400 py-3 px-4">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? data.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-[#354153] hover:bg-[#354153] transition-colors"
                >
                  <td className="text-white py-3 px-4">
                    {item.data_transacao}
                  </td>
                  <td className="text-white text-right py-3 px-4">
                    {item.total_transacoes}
                  </td>
                  <td className="text-white text-right py-3 px-4">
                    {formatCurrency(parseFloat(item.valor_total.replace(/\./g, "").replace(",", ".")))}
                  </td>
                  <td className="text-green-400 text-right py-3 px-4">
                    {formatCurrency(parseFloat(item.lucro_total.replace(/\./g, "").replace(",", ".")))}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-gray-400 text-center py-8">
                    Nenhum dado disponível
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
