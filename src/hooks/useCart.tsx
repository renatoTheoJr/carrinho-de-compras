import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart'); //Buscar dados do localStorage
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);
      const { amount } = response.data;
      if(!amount) throw "Erro";
      const productAmout = cart.find(p => p.id === productId);
      if(productAmout && productAmout.amount + 1 > amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if(productAmout) {
        setCart(cart.map(p => p.id === productId ? { ...p, amount: p.amount + 1 } : p));
      }else{
        const product =  (await api.get(`/products/${productId}`)).data;
        

        setCart([...cart, { ...product, amount: 1 }]);
      }
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

   } catch {
      toast.error('Erro ao adicionar o produto no carrinho');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(p => p.id === productId);
      if(!product) throw "Erro";
      setCart(cart.filter(p => p.id !== productId));
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return;
      }
      const response = await api.get(`/stock/${productId}`);
      const  amountStock = response.data.amount;
      if(amount > amountStock) {
        toast.error(`Quantidade solicitada fora de estoque`);
        return;
      }
      setCart(cart.map(p => p.id === productId ? { ...p, amount } : p));
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
