const inquiries = [
  {
    customer: "Vietnam Plastics Co.",
    product: "伺服液压注塑机",
    tonnage: "260T",
    quantity: "3台",
    status: "新询盘",
    statusColor: "bg-blue-50 text-blue-700",
    time: "2小时前",
  },
  {
    customer: "PT Indo Molding",
    product: "全电动注塑机",
    tonnage: "150T",
    quantity: "2台",
    status: "已回复",
    statusColor: "bg-emerald-50 text-emerald-700",
    time: "5小时前",
  },
  {
    customer: "Bangkok Pack Ltd.",
    product: "二板式注塑机",
    tonnage: "1000T",
    quantity: "1台",
    status: "新询盘",
    statusColor: "bg-blue-50 text-blue-700",
    time: "1天前",
  },
  {
    customer: "Manila Container Corp",
    product: "肘杆式注塑机",
    tonnage: "380T",
    quantity: "5台",
    status: "已报价",
    statusColor: "bg-amber-50 text-amber-700",
    time: "2天前",
  },
  {
    customer: "KL Rubber Products",
    product: "立式注塑机",
    tonnage: "85T",
    quantity: "4台",
    status: "已成交",
    statusColor: "bg-emerald-50 text-emerald-700",
    time: "3天前",
  },
];

export default function InquiriesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          询盘中心
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          收集和管理客户询盘
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 font-medium text-gray-500">客户</th>
              <th className="px-6 py-3 font-medium text-gray-500">产品需求</th>
              <th className="px-6 py-3 font-medium text-gray-500">锁模力</th>
              <th className="px-6 py-3 font-medium text-gray-500">数量</th>
              <th className="px-6 py-3 font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 font-medium text-gray-500">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inquiries.map((row, i) => (
              <tr key={i} className="transition hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {row.customer}
                </td>
                <td className="px-6 py-4 text-gray-700">{row.product}</td>
                <td className="px-6 py-4 text-gray-700">{row.tonnage}</td>
                <td className="px-6 py-4 text-gray-700">{row.quantity}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${row.statusColor}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
