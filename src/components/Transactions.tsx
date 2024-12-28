import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Transaction, fetchTransactions } from "../services/transactionService";

const Transactions: React.FC = () => {
  const { data: transactions, isLoading, error } = useQuery<Transaction[], Error>({
    queryKey: ["transactions"],
    queryFn: fetchTransactions
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="transactions-list">
      {transactions?.map((transaction) => (
        <div key={transaction.id} className="transaction-item">
          <h3>{transaction.description}</h3>
          <p>Amount: ${transaction.amount}</p>
          <p>Category: {transaction.category}</p>
          <p>Type: {transaction.type}</p>
          <p>Date: {new Date(transaction.date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};

export default Transactions;
