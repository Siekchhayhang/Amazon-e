import { AlertTriangle } from "lucide-react";
const LOW_STOCK_THRESHOLD = 10;

type StockStatusProps = {
  countInStock: number;
};

const StockStatus = ({ countInStock }: StockStatusProps) => {
  // Check if the stock is low or out of stock
  const isLowStock = countInStock <= LOW_STOCK_THRESHOLD && countInStock > 0;
  const isOutOfStock = countInStock === 0;

  if (isOutOfStock) {
    return (
      <div className="flex items-center gap-1.5 text-red-600 font-semibold">
        <AlertTriangle className="h-4 w-4" />
        <span>Out of Stock</span>
      </div>
    );
  }

  if (isLowStock) {
    return (
      <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
        <AlertTriangle className="h-4 w-4" />
        <span>{countInStock}</span>
      </div>
    );
  }

  // If stock is not low, just return the number
  return <span>{countInStock}</span>;
};

export default StockStatus;
