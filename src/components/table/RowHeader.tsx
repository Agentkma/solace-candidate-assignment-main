import React from 'react';

type Props = React.ThHTMLAttributes<HTMLTableCellElement> & {
  children: React.ReactNode;
};

export default function RowHeader({ children, className = '', ...rest }: Props) {
  return (
    <th scope="row" className={`px-4 py-3 text-sm font-medium text-gray-900 align-top ${className}`} {...rest}>
      {children}
    </th>
  );
}
