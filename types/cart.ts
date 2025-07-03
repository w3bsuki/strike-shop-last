// Cart Types
export interface CartItem {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    product: {
      id: string;
      title: string;
      handle: string;
      images: {
        nodes: Array<{
          url: string;
          altText?: string;
        }>;
      };
    };
  };
}

export interface Cart {
  id?: string;
  lines: CartItem[];
  totalQuantity: number;
  estimatedCost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}