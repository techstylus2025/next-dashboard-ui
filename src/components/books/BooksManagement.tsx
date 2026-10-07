"use client";

import Image from "next/image";
import { BookOpen, Search, ShoppingBag, Boxes } from "lucide-react";
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
  publication: string;
  classId: number | null;
  className: string;
  price: number;
  quantity: number;
  supplierName?: string;
  supplierContact?: string;
};

export type BookOrderRow = {
  id: number;
  parentId: string;
  parentName: string;
  status: string;
  pickupCode: string;
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
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogClassId, setCatalogClassId] = useState("all");

  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRow | null>(null);
  const [title, setTitle] = useState("");
  const [publication, setPublication] = useState("");
  const [classId, setClassId] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");

  const [cart, setCart] = useState<Record<number, number>>({});

  type GroupedBookSet = {
    title: string;
    publication: string;
    books: BookRow[];
  };

  const filteredBooks = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return books.filter((book) => {
      const matchesClass =
        catalogClassId === "all" ||
        book.classId === null ||
        book.classId === Number(catalogClassId);
      const matchesSearch =
        !query ||
        [book.title, book.publication, book.className].some((value) =>
          value.toLowerCase().includes(query)
        );
      return matchesClass && matchesSearch;
    });
  }, [books, catalogClassId, catalogSearch]);

  const inventoryCopies = books.reduce((total, book) => total + book.quantity, 0);
  const classCount = new Set(
    books.flatMap((book) => book.classId === null ? [] : [book.classId])
  ).size;

  const booksByClass = useMemo(() => {
    const sections = new Map<number | null, { classId: number | null; className: string; books: BookRow[] }>();

    filteredBooks.forEach((book) => {
      const section = sections.get(book.classId) ?? {
        classId: book.classId,
        className: book.className,
        books: [],
      };
      section.books.push(book);
      sections.set(book.classId, section);
    });

    return Array.from(sections.values())
      .map((section) => ({
        ...section,
        books: section.books.sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }, [filteredBooks]);

  const groupedBooksByClass = useMemo(
    () => booksByClass.map((section) => {
      const groups = new Map<string, GroupedBookSet>();

      section.books.forEach((book) => {
        const key = `${book.title}::${book.publication || ""}`.toLowerCase();
        const group = groups.get(key) ?? {
          title: book.title,
          publication: book.publication || "",
          books: [],
        };
        group.books.push(book);
        groups.set(key, group);
      });

      return {
        classId: section.classId,
        className: section.className,
        groups: Array.from(groups.values()).sort((a, b) => {
          const titleDiff = a.title.localeCompare(b.title);
          return titleDiff !== 0 ? titleDiff : a.publication.localeCompare(b.publication);
        }),
      };
    }),
    [booksByClass]
  );

  const resetBookForm = () => {
    setTitle("");
    setPublication("");
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
    setPublication(book.publication ?? "");
    setClassId(book.classId === null ? "general" : String(book.classId));
    setPrice(String(book.price));
    setQuantity(String(book.quantity));
    setSupplierName(book.supplierName ?? "");
    setSupplierContact(book.supplierContact ?? "");
    setBookFormOpen(true);
  };

  const handleSaveBook = () => {
    const cId = classId === "general" ? null : Number.parseInt(classId, 10);
    const p = parseFloat(price);
    const q = parseInt(quantity, 10);
    if (!title.trim() || !publication.trim() || (cId !== null && Number.isNaN(cId))) {
      toast.error("Enter book title, publication, and choose a class or general access.");
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
        publication: publication.trim(),
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
        toast.success(
          res.pickupCode
            ? `Order sent to admin. Pickup code: ${res.pickupCode}`
            : "Order sent to admin for confirmation."
        );
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
  const parentOrderGroups = useMemo(() => {
    const groups = new Map<string, { parentId: string; parentName: string; orders: BookOrderRow[] }>();
    for (const order of orders) {
      const group = groups.get(order.parentId) ?? {
        parentId: order.parentId,
        parentName: order.parentName,
        orders: [],
      };
      group.orders.push(order);
      groups.set(order.parentId, group);
    }
    return Array.from(groups.values()).sort((a, b) => {
      const latestOrderA = a.orders[0]?.createdAt ?? "";
      const latestOrderB = b.orders[0]?.createdAt ?? "";
      return latestOrderB.localeCompare(latestOrderA);
    });
  }, [orders]);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-3 sm:p-5 lg:p-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              School bookstore
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {canAdmin ? "Books & inventory" : "Find your next book"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
          {canAdmin
            ? "Manage inventory, supplier details, and parent book orders."
            : isParent
              ? "Browse available books and send your order to the school."
              : role === "teacher"
                ? "Browse available books and prices. Ordering is available to parents."
                : "Browse available books and prices."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-3 lg:min-w-[390px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <BookOpen className="mb-3 h-5 w-5 text-sky-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{books.length}</p>
              <p className="mt-1 text-xs text-slate-300">Book listings</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <Boxes className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{inventoryCopies}</p>
              <p className="mt-1 text-xs text-slate-300">Copies in stock</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur sm:col-span-1">
              <ShoppingBag className="mb-3 h-5 w-5 text-violet-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{classCount}</p>
              <p className="mt-1 text-xs text-slate-300">Classes covered</p>
            </div>
          </div>
        </div>
      </section>

      {(!canAdmin || adminTab === "books") && (
        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end sm:p-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Search the catalogue</span>
            <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition focus-within:border-sky-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
              <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search title, publication, or class"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Class</span>
            <select
              value={catalogClassId}
              onChange={(event) => setCatalogClassId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            >
              <option value="all">All classes</option>
              {classes.map((classOption) => (
                <option key={classOption.id} value={classOption.id}>
                  {classOption.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

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
                  <span className="text-slate-600">Publication</span>
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    value={publication}
                    onChange={(e) => setPublication(e.target.value)}
                    placeholder="e.g. Oxford University Press"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-600">Class</span>
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    <option value="">Select book access</option>
                    <option value="general">General access (all classes)</option>
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

          <section className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Stock control</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Book inventory</h2>
            </div>
            {filteredBooks.length === 0 ? (
              <p className="text-sm text-slate-500">{books.length ? "No books match these filters." : "No books in inventory yet."}</p>
            ) : (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Publication</th>
                    <th className="px-3 py-3">Class</th>
                    <th className="px-3 py-3 text-right">Price (₵)</th>
                    <th className="px-3 py-3 text-center">Stock</th>
                    <th className="px-3 py-3">Supplier</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="w-24 px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {booksByClass.map((section) => (
                    <tr key={section.classId ?? "general"} className="border-b border-slate-200">
                      <td colSpan={8} className="p-0">
                        <details className="smooth-disclosure">
                          <summary className="cursor-pointer list-none bg-slate-50 px-3 py-3 font-semibold text-slate-800 transition-colors hover:bg-sky-50">
                            {section.className}
                            <span className="ml-2 text-xs font-medium text-slate-500">
                              {section.books.length} book{section.books.length === 1 ? "" : "s"}
                            </span>
                          </summary>
                          <div className="smooth-disclosure-panel">
                            <div className="smooth-disclosure-panel-inner">
                              <table className="w-full min-w-[720px] text-left text-sm">
                                <tbody>
                                  {section.books.map((book) => (
                                    <tr key={book.id} className="border-b border-slate-100 text-slate-700 transition-colors hover:bg-sky-50/50">
                                      <td className="px-3 py-3 font-semibold text-slate-900">{book.title}</td>
                                      <td className="px-3 py-3 text-slate-600">{book.publication || "—"}</td>
                                      <td className="px-3 py-3">{book.className}</td>
                                      <td className="px-3 py-3 text-right font-semibold">₵{book.price.toFixed(2)}</td>
                                      <td className="px-3 py-3 text-center">
                                        <span className={`inline-flex min-w-9 justify-center rounded-full px-2 py-1 text-xs font-semibold ${book.quantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                          {book.quantity}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3">{book.supplierName || "—"}</td>
                                      <td className="px-3 py-3">{book.supplierContact || "—"}</td>
                                      <td className="px-3 py-3">
                                        <div className="flex justify-center gap-2">
                                          <button type="button" title="Edit" onClick={() => openEditBook(book)} className="rounded-lg p-2 hover:bg-sky-100"><Image src="/edit.svg" alt="" width={16} height={16} /></button>
                                          <button type="button" title="Delete" onClick={() => handleDeleteBook(book.id)} className="rounded-lg p-2 hover:bg-red-100"><Image src="/delete.svg" alt="" width={16} height={16} /></button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </details>
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
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Order management</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Parent orders</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{parentOrderGroups.length} families</span>
              {pendingOrderCount > 0 && (
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">{pendingOrderCount} pending</span>
              )}
            </div>
          </div>
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              No parent orders have been placed yet.
            </div>
          ) : (
            <div className="space-y-4">
              {parentOrderGroups.map((group) => (
                <details key={group.parentId} className="group overflow-hidden rounded-2xl border border-slate-200">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
                    <div>
                      <h3 className="font-semibold text-slate-900">{group.parentName}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {group.orders.length} order{group.orders.length === 1 ? "" : "s"} · {group.orders.reduce((total, order) => total + order.items.length, 0)} line items
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                      {group.orders.filter((order) => order.status === "PENDING").length} pending
                    </span>
                    <span className="ml-auto text-xs font-semibold text-sky-700 group-open:hidden">View orders</span>
                    <span className="ml-auto hidden text-xs font-semibold text-slate-500 group-open:inline">Hide orders</span>
                  </summary>
                  <div className="space-y-3 p-3 sm:p-4">
                    {group.orders.map((order) => (
                      <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">Order #{order.id}</span>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                order.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700"
                                  : order.status === "CONFIRMED"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}>{order.status}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(order.createdAt).toLocaleString()} · Pickup: {order.pickupCode}
                            </p>
                          </div>
                          {order.status === "PENDING" && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => handleConfirmOrder(order.id)}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Confirm & adjust stock
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => handleCancelOrder(order.id)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                        <ul className="mt-3 space-y-2 text-sm">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-4">
                              <span className="text-slate-700">
                                {item.bookTitle} <span className="text-slate-400">({item.className})</span> × {item.quantity}
                              </span>
                              <span className="shrink-0 font-medium tabular-nums text-slate-700">
                                ₵{(item.unitPrice * item.quantity).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 text-sm font-bold text-slate-900">
                          Total: ₵{order.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0).toFixed(2)}
                        </div>
                      </article>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      )}

      {isParent && (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Browse & choose</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Available books</h2>
              </div>
              <p className="text-sm text-slate-500">{filteredBooks.length} listing{filteredBooks.length === 1 ? "" : "s"} shown</p>
            </div>
            {filteredBooks.length === 0 ? (
              <p className="text-sm text-slate-500">{books.length ? "No books match these filters." : "No books available right now."}</p>
            ) : (
              <div className="space-y-6">
                {groupedBooksByClass.map(({ classId, className, groups }) => (
                  <details key={classId ?? "general"} open className="group smooth-disclosure rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                      <span>
                        <span className="block text-lg font-bold text-slate-900">{className}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {classId === null ? "Available to all classes" : "Recommended books for this class"}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">{groups.length} book set{groups.length === 1 ? "" : "s"}</span>
                    </summary>
                    <div className="smooth-disclosure-panel">
                      <div className="smooth-disclosure-panel-inner">
                        <div className="grid gap-4 pt-5 sm:grid-cols-2 xl:grid-cols-3">
                        {groups.map((group) => (
                        <div
                          key={`${group.title}-${group.publication}`}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-slate-900/5"
                        >
                          <div className="flex items-start gap-3 p-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-800">
                              <BookOpen className="h-6 w-6" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="line-clamp-2 font-bold leading-snug text-slate-900">{group.title}</h3>
                                <span className="shrink-0 rounded-full bg-sky-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                                  {group.books.length} option{group.books.length === 1 ? "" : "s"}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-sm text-slate-500">
                                {group.publication || "General publication"}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 border-t border-slate-100 bg-slate-50/70 p-3">
                            {group.books.map((book) => {
                              const qty = cart[book.id] ?? 0;
                              const inStock = book.quantity > 0;
                              return (
                                <div
                                  key={book.id}
                                  className={`rounded-xl border p-3 transition-colors ${
                                    inStock
                                      ? "border-slate-200 bg-white"
                                      : "border-slate-100 bg-slate-100 opacity-70"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-800">
                                      {book.className}
                                    </span>
                                    <span className="text-base font-bold text-sky-800">
                                      ₵{book.price.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className={`mt-1 text-xs font-medium ${inStock ? "text-emerald-700" : "text-rose-600"}`}>
                                    {inStock ? `${book.quantity} in stock` : "Out of stock"}
                                  </p>
                                  {inStock && (
                                    <label className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs font-medium text-slate-600">
                                      Quantity
                                      <input
                                        type="number"
                                        aria-label={`Quantity of ${book.title} for ${book.className}`}
                                        min={0}
                                        max={book.quantity}
                                        value={qty || ""}
                                        onChange={(e) =>
                                          setCartQty(
                                            book.id,
                                            parseInt(e.target.value, 10) || 0
                                          )
                                        }
                                        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                      />
                                    </label>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
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
                      {new Date(order.createdAt).toLocaleDateString()} — Pickup: {order.pickupCode} —{" "}
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
            {role === "teacher"
              ? "Teacher access is view-only. Parents can place book orders from their account."
              : "Book orders can be placed from a parent account."}
          </p>
          {filteredBooks.length > 0 ? (
            <div className="mt-5 space-y-4">
              {booksByClass.map((section) => (
                <section key={section.classId ?? "general"} aria-label={`${section.className} books`}>
                <details className="smooth-disclosure rounded-2xl border border-slate-200 bg-white p-4">
                  <summary className="mb-3 flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                    <span className="font-bold text-slate-900">{section.className}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{section.books.length} book{section.books.length === 1 ? "" : "s"}</span>
                    </summary>
                    <div className="smooth-disclosure-panel">
                      <div className="smooth-disclosure-panel-inner">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {section.books.map((book) => (
                            <div key={book.id} className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 text-sm shadow-sm">
                              <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900">{book.title}</p>
                                  <p className="mt-1 text-slate-500">{book.publication || "General publication"}</p>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="text-xs font-medium text-slate-500">Available for {book.className}</span>
                                <span className="font-bold text-sky-800">₵{book.price.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>
                </section>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">{books.length ? "No books match these filters." : "No books are available right now."}</p>
          )}
        </section>
      )}
    </div>
  );
}
