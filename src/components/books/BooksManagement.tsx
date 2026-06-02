"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import {
  cancelBookOrder,
  confirmBookOrder,
  createBook,
  deleteBook,
  submitBookOrder,
  updateBook,
} from "@/lib/bookActions";

export type ClassOption = { id: number; name: string };

export type BookRow = {
  id: number;
  title: string;
  classId: number;
  className: string;
  price: number;
  quantity: number;
  supplierName?: string;
  supplierContact?: string;
};

export type BookOrderRow = {
  id: number;
  parentName: string;
  status: string;
  createdAt: string;
  items: {
    id: number;
    bookTitle: string;
    className: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export default function BooksManagement({
  role,
  classes,
  books,
  orders,
  pendingOrderCount,
  canAdmin,
  isParent,
}: {
  role: string | undefined;
  classes: ClassOption[];
  books: BookRow[];
  orders: BookOrderRow[];
  pendingOrderCount: number;
  canAdmin: boolean;
  isParent: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adminTab, setAdminTab] = useState<"books" | "orders">("books");

  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRow | null>(null);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");

  const [cart, setCart] = useState<Record<number, number>>({});

  const resetBookForm = () => {
    setTitle("");
    setClassId("");
    setPrice("");
    setQuantity("");
    setSupplierName("");
    setSupplierContact("");
    setEditingBook(null);
    setBookFormOpen(false);
  };

  const openEditBook = (book: BookRow) => {
    setEditingBook(book);
    setTitle(book.title);
    setClassId(String(book.classId));
    setPrice(String(book.price));
    setQuantity(String(book.quantity));
    setSupplierName(book.supplierName ?? "");
    setSupplierContact(book.supplierContact ?? "");
    setBookFormOpen(true);
  };

  const handleSaveBook = () => {
    const cId = parseInt(classId, 10);
    const p = parseFloat(price);
    const q = parseInt(quantity, 10);
    if (!title.trim() || !classId || Number.isNaN(cId)) {
      toast.error("Enter book title and class.");
      return;
    }
    if (Number.isNaN(p) || p <= 0) {
      toast.error("Enter a valid price.");
      return;
    }
    if (Number.isNaN(q) || q < 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    if (!supplierName.trim() || !supplierContact.trim()) {
      toast.error("Enter supplier name and contact.");
      return;
    }
    startTransition(async () => {
      const payload = {
        title: title.trim(),
        classId: cId,
        priceCedis: p,
        quantity: q,
        supplierName: supplierName.trim(),
        supplierContact: supplierContact.trim(),
      };
      const res = editingBook
        ? await updateBook({ id: editingBook.id, ...payload })
        : await createBook(payload);
      if (res.success) {
        toast.success(editingBook ? "Book updated." : "Book added.");
        resetBookForm();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save book.");
      }
    });
  };

  const handleDeleteBook = (id: number) => {
    if (!confirm("Delete this book record?")) return;
    startTransition(async () => {
      const res = await deleteBook(id);
      if (res.success) {
        toast.success("Book deleted.");
        router.refresh();
      } else {
        toast.error(res.error || "Delete failed.");
      }
    });
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([bookId, qty]) => {
        const book = books.find((b) => b.id === parseInt(bookId, 10));
        return book ? { book, qty } : null;
      })
      .filter(Boolean) as { book: BookRow; qty: number }[];
  }, [cart, books]);

  const cartTotal = useMemo(
    () => cartItems.reduce((s, { book, qty }) => s + book.price * qty, 0),
    [cartItems]
  );

  const setCartQty = (bookId: number, qty: number) => {
    const book = books.find((b) => b.id === bookId);
    const max = book?.quantity ?? 0;
    const next = Math.max(0, Math.min(qty, max));
    setCart((prev) => {
      const copy = { ...prev };
      if (next === 0) delete copy[bookId];
      else copy[bookId] = next;
      return copy;
    });
  };

  const handleSubmitOrder = () => {
    if (cartItems.length === 0) {
      toast.error("Select at least one book.");
      return;
    }
    startTransition(async () => {
      const res = await submitBookOrder(
        cartItems.map(({ book, qty }) => ({ bookId: book.id, quantity: qty }))
      );
      if (res.success) {
        toast.success("Order sent to admin for confirmation.");
        setCart({});
        router.refresh();
      } else {
        toast.error(res.error || "Could not submit order.");
      }
    });
  };

  const handleConfirmOrder = (orderId: number) => {
    if (!confirm("Confirm this order? Stock will be reduced.")) return;
    startTransition(async () => {
      const res = await confirmBookOrder(orderId);
      if (res.success) {
        toast.success("Order confirmed and stock updated.");
        router.refresh();
      } else {
        toast.error(res.error || "Could not confirm order.");
      }
    });
  };

  const handleCancelOrder = (orderId: number) => {
    if (!confirm("Cancel this order?")) return;
    startTransition(async () => {
      const res = await cancelBookOrder(orderId);
      if (res.success) {
        toast.success("Order cancelled.");
        router.refresh();
      } else {
        toast.error(res.error || "Could not cancel order.");
      }
    });
  };

  const pendingOrders = orders.filter((o) => o.status === "PENDING");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Purchase books</h1>
        <p className="text-sm text-slate-500 mt-1">
          {canAdmin
            ? "Manage inventory, supplier details, and parent book orders."
            : isParent
              ? "Browse available books and send your order to the school."
              : "School book catalog."}
        </p>
      </div>

      {canAdmin && (
        <div className="flex gap-2 border-b border-slate-200/80">
          <button
            type="button"
            onClick={() => setAdminTab("books")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              adminTab === "books"
                ? "border-sky-600 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Book inventory
          </button>
          <button
            type="button"
            onClick={() => setAdminTab("orders")}
            className={`relative px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              adminTab === "orders"
                ? "border-sky-600 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Parent orders
            {pendingOrderCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {pendingOrderCount}
              </span>
            )}
          </button>
        </div>
      )}

      {canAdmin && adminTab === "books" && (
        <>
          <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-slate-800">
                {editingBook ? "Edit book" : "Add book (admin)"}
              </h2>
              {!bookFormOpen && !editingBook && (
                <button
                  type="button"
                  onClick={() => setBookFormOpen(true)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  + New book
                </button>
              )}
            </div>
            {(bookFormOpen || editingBook) && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-600">Book title (subject)</span>
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mathematics"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-600">Class</span>
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-600">Price (₵)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-600">Quantity (stock)</span>
                  <input
                    type="number"
                    min="0"
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-600">Supplier name</span>
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-600">Supplier contact</span>
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                  />
                </label>
              </div>
            )}
            {(bookFormOpen || editingBook) && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleSaveBook}
                  className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {editingBook ? "Update book" : "Save book"}
                </button>
                <button
                  type="button"
                  onClick={resetBookForm}
                  className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-medium text-slate-800 mb-4">
              Book records
            </h2>
            {books.length === 0 ? (
              <p className="text-sm text-slate-500">No books in inventory yet.</p>
            ) : (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="pb-3 pr-2">Title</th>
                    <th className="pb-3 pr-2">Class</th>
                    <th className="pb-3 pr-2 text-right">Price (₵)</th>
                    <th className="pb-3 pr-2 text-center">Stock</th>
                    <th className="pb-3 pr-2">Supplier</th>
                    <th className="pb-3 pr-2">Contact</th>
                    <th className="pb-3 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr
                      key={book.id}
                      className="border-b border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="py-3 pr-2 font-medium">{book.title}</td>
                      <td className="py-3 pr-2">{book.className}</td>
                      <td className="py-3 pr-2 text-right">
                        {book.price.toFixed(2)}
                      </td>
                      <td className="py-3 pr-2 text-center">{book.quantity}</td>
                      <td className="py-3 pr-2">{book.supplierName}</td>
                      <td className="py-3 pr-2">{book.supplierContact}</td>
                      <td className="py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEditBook(book)}
                            className="rounded-lg p-2 hover:bg-sky-100"
                          >
                            <Image src="/edit.svg" alt="" width={16} height={16} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDeleteBook(book.id)}
                            className="rounded-lg p-2 hover:bg-red-100"
                          >
                            <Image src="/delete.svg" alt="" width={16} height={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {canAdmin && adminTab === "orders" && (
        <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-800 mb-4">
            Orders from parents
            {pendingOrderCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                {pendingOrderCount} pending
              </span>
            )}
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-slate-200 p-4 bg-slate-50/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {order.parentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleString()} ·{" "}
                        <span
                          className={
                            order.status === "PENDING"
                              ? "text-amber-700 font-medium"
                              : order.status === "CONFIRMED"
                                ? "text-emerald-700 font-medium"
                                : "text-slate-500"
                          }
                        >
                          {order.status}
                        </span>
                      </p>
                    </div>
                    {order.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleConfirmOrder(order.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Confirm & adjust stock
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleCancelOrder(order.id)}
                          className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <ul className="text-sm space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-4">
                        <span>
                          {item.bookTitle} ({item.className}) × {item.quantity}
                        </span>
                        <span className="text-slate-600">
                          ₵{(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {isParent && (
        <>
          <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-800 mb-4">
              Available books
            </h2>
            {books.length === 0 ? (
              <p className="text-sm text-slate-500">No books available right now.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => {
                  const qty = cart[book.id] ?? 0;
                  const inStock = book.quantity > 0;
                  return (
                    <div
                      key={book.id}
                      className={`rounded-xl border p-4 ${
                        inStock
                          ? "border-slate-200 bg-white"
                          : "border-slate-100 bg-slate-50 opacity-60"
                      }`}
                    >
                      <h3 className="font-semibold text-slate-800">{book.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{book.className}</p>
                      <p className="mt-2 text-sm font-medium text-sky-700">
                        ₵{book.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {inStock ? `${book.quantity} in stock` : "Out of stock"}
                      </p>
                      {inStock && (
                        <div className="mt-3 flex items-center gap-2">
                          <label className="text-xs text-slate-600">Qty</label>
                          <input
                            type="number"
                            min={0}
                            max={book.quantity}
                            value={qty || ""}
                            onChange={(e) =>
                              setCartQty(
                                book.id,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {cartItems.length > 0 && (
            <section className="rounded-2xl border border-sky-200 bg-sky-50/80 p-6 shadow-sm sticky bottom-4">
              <h3 className="font-medium text-slate-800 mb-2">Your order</h3>
              <ul className="text-sm space-y-1 mb-3">
                {cartItems.map(({ book, qty }) => (
                  <li key={book.id} className="flex justify-between">
                    <span>
                      {book.title} × {qty}
                    </span>
                    <span>₵{(book.price * qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold text-slate-800 mb-3">
                Total: ₵{cartTotal.toFixed(2)}
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={handleSubmitOrder}
                className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Send order to admin
              </button>
            </section>
          )}

          {orders.length > 0 && (
            <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
              <h2 className="text-lg font-medium text-slate-800 mb-4">
                My orders
              </h2>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-200 p-3 text-sm"
                  >
                    <p className="font-medium text-slate-700">
                      {new Date(order.createdAt).toLocaleDateString()} —{" "}
                      <span
                        className={
                          order.status === "CONFIRMED"
                            ? "text-emerald-600"
                            : order.status === "PENDING"
                              ? "text-amber-600"
                              : "text-slate-500"
                        }
                      >
                        {order.status}
                      </span>
                    </p>
                    <ul className="mt-2 text-slate-600 space-y-0.5">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.bookTitle} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {!canAdmin && !isParent && (
        <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Book purchasing is available for parents. Please sign in as a parent
            to place orders.
          </p>
          {books.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <p className="font-medium">{book.title}</p>
                  <p className="text-slate-500">{book.className}</p>
                  <p className="text-sky-700">₵{book.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
