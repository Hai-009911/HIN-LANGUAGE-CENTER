import React from 'react';

const TableSkeleton: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th scope="col" className="px-6 py-3">
              <div className="h-4 rounded w-24 shimmer-wrapper"></div>
            </th>
            <th scope="col" className="px-6 py-3">
              <div className="h-4 rounded w-48 shimmer-wrapper"></div>
            </th>
            <th scope="col" className="px-6 py-3">
              <div className="h-4 rounded w-16 shimmer-wrapper"></div>
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 rounded w-32 shimmer-wrapper"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 rounded w-40 shimmer-wrapper"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-6 rounded-full w-20 shimmer-wrapper"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                    <div className="h-6 rounded w-12 shimmer-wrapper"></div>
                    <div className="h-6 rounded w-16 shimmer-wrapper"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;