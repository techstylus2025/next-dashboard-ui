const Table = ({
  columns,
  renderRow,
  data,
  className,
}: {
  columns: { header: string; accessor: string; className?: string }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
  className?: string;
}) => {
  return (
    <div className={`overflow-x-auto rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm ${className ?? ""}`}>
      <table className="min-w-full w-full table-auto text-sm sm:text-sm break-words">
        <thead className="bg-slate-50">
          <tr className="text-left text-slate-500 text-xs uppercase tracking-[0.08em]">
            {columns.map((col) => (
              <th
                key={col.accessor}
                className={`px-4 py-3 font-semibold text-slate-700 ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.map((item) => renderRow(item))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
