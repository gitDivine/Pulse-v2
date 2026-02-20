"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils/format";
import { Plus, Pencil, Trash2, X, Package } from "lucide-react";

interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  category: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductListProps {
  products: Product[];
  businessId: string;
}

export function ProductList({ products: initialProducts, businessId }: ProductListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategory("");
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(product: Product) {
    setName(product.name);
    setDescription(product.description || "");
    setPrice((product.price / 100).toString());
    setStock(product.stock_quantity.toString());
    setCategory(product.category || "");
    setEditingId(product.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const priceInKobo = Math.round(parseFloat(price) * 100);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update({
            name,
            description: description || null,
            price: priceInKobo,
            stock_quantity: parseInt(stock),
            category: category || null,
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({
          business_id: businessId,
          name,
          description: description || null,
          price: priceInKobo,
          stock_quantity: parseInt(stock),
          category: category || null,
          images: [],
        });
        if (error) throw error;
      }
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save product";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    router.refresh();
  }

  async function togglePublished(id: string, current: boolean) {
    await supabase.from("products").update({ is_published: !current }).eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Product" : "New Product"}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label="Product Name"
              placeholder="e.g. Shea Butter Body Cream"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Description (optional)"
              placeholder="Brief product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Price (₦)"
                type="number"
                placeholder="5000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                required
              />
              <Input
                label="Stock Quantity"
                type="number"
                placeholder="100"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                required
              />
            </div>
            <Input
              label="Category (optional)"
              placeholder="e.g. Skincare"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingId ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Product list */}
      {products.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-900">No products yet</p>
          <p className="mt-1 text-sm text-gray-500">Add your first product to start selling.</p>
          <Button onClick={() => setShowForm(true)} className="mt-4" size="sm">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  {!product.is_published && (
                    <Badge className="bg-gray-100 text-gray-600">Draft</Badge>
                  )}
                  {product.stock_quantity <= product.low_stock_threshold && (
                    <Badge className="bg-red-100 text-red-700">Low stock</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formatNaira(product.price)} &middot; {product.stock_quantity} in stock
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => togglePublished(product.id, product.is_published)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200"
                >
                  {product.is_published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => startEdit(product)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
