export interface Category {
  id: number;
  name: string;
}
export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  rating: number;
  url: string;
  categoryId: number;
  categoryName: string;
  category: Category ;
}