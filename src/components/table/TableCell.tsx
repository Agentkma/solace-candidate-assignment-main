import React from 'react';

type Props = React.TdHTMLAttributes<HTMLTableCellElement> & {
  children: React.ReactNode;
};

export default function TableCell({ children, className = '', ...rest }: Props) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 align-top ${className}`} {...rest}>
      {children}
    </td>
  );
}
