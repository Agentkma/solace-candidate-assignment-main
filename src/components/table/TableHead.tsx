import React from 'react';

type Props = React.ThHTMLAttributes<HTMLTableCellElement> & {
  children: React.ReactNode;
};

export default function TableHead({ children, className = '', ...rest }: Props) {
  return (
    <th
      scope="col"
      className={`px-4 py-2 text-left text-sm font-medium text-gray-600 ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}
